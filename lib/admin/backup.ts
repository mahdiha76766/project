import fs from 'fs';
import path from 'path';
import * as archiver from 'archiver';
import mongoose from 'mongoose';
import { connectToDatabase } from '@/lib/db/mongoose';
import { google } from 'googleapis';
import { getBackupSettings } from './backup-config';
import cron from 'node-cron';
import * as unzip from 'unzip-stream';

// Path for temporary backups
const TEMP_DIR = path.join(process.cwd(), 'temp-backups');
const UPLOADS_DIR = path.join(process.cwd(), 'uploads');

// Ensure temp dir exists
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

// Function to generate the backup zip file
export async function createBackupZip(): Promise<string> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `backup-${timestamp}.zip`;
  const filePath = path.join(TEMP_DIR, filename);

  const output = fs.createWriteStream(filePath);
  // @ts-ignore
  const archive = archiver('zip', { zlib: { level: 9 } });

  return new Promise(async (resolve, reject) => {
    // output.on('close', () => resolve(filePath)); // Handled after db stream
    archive.on('error', (err: any) => reject(err));

    archive.pipe(output);

    // 1. Add uploads folder
    if (fs.existsSync(UPLOADS_DIR)) {
      archive.directory(UPLOADS_DIR, 'uploads');
    }

    // 2. Export Database to JSON
    // Stream data to avoid loading whole DB in memory
    await connectToDatabase();
    const collections = mongoose.connection.collections;
    const dbFilePath = path.join(TEMP_DIR, `database-${Date.now()}.json`);
    const dbStream = fs.createWriteStream(dbFilePath);

    dbStream.write('{\n');
    let firstCollection = true;

    for (const [name, collection] of Object.entries(collections)) {
      if (!firstCollection) dbStream.write(',\n');
      firstCollection = false;
      dbStream.write(`"${name}": [\n`);

      const cursor = collection.find({});
      let firstDoc = true;
      while (await cursor.hasNext()) {
        const doc = await cursor.next();
        if (!firstDoc) dbStream.write(',\n');
        firstDoc = false;
        dbStream.write(JSON.stringify(doc));
      }
      dbStream.write('\n]');
    }
    dbStream.write('\n}');
    dbStream.end();

    await new Promise<void>((resolveDbStream) => dbStream.on('finish', () => resolveDbStream()));

    archive.file(dbFilePath, { name: 'database.json' });

    // Clean up temporary database file after archive finalizes
    output.on('close', () => {
      deleteTempFile(dbFilePath);
      resolve(filePath);
    });

    await archive.finalize();
  });
}

// Function to upload file to Google Drive
export async function uploadToGoogleDrive(filePath: string): Promise<void> {
  const settings = getBackupSettings();
  if (!settings.googleServiceAccountJson || !settings.googleDriveFolderId) {
    throw new Error('Google Drive credentials or Folder ID are not configured.');
  }

  const credentials = JSON.parse(settings.googleServiceAccountJson);

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/drive.file'],
  });

  const drive = google.drive({ version: 'v3', auth });

  const filename = path.basename(filePath);

  await drive.files.create({
    requestBody: {
      name: filename,
      parents: [settings.googleDriveFolderId],
    },
    media: {
      mimeType: 'application/zip',
      body: fs.createReadStream(filePath),
    },
  });
}

// Function to delete temp file
export function deleteTempFile(filePath: string) {
  if (fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath);
    } catch (e) {
      console.error('Error deleting temp file', e);
    }
  }
}

// Cron Job Variable
let activeCronJob: any = null;

export function initializeCronJob() {
  const settings = getBackupSettings();

  if (activeCronJob) {
    activeCronJob.stop();
  }

  if (settings.enabled) {
    activeCronJob = cron.schedule(settings.schedule, async () => {
      console.log('[Backup Cron] Starting scheduled backup...');
      try {
        const filePath = await createBackupZip();
        console.log(`[Backup Cron] Zip created at ${filePath}`);
        await uploadToGoogleDrive(filePath);
        console.log('[Backup Cron] Uploaded to Google Drive successfully.');
        deleteTempFile(filePath);
      } catch (error) {
        console.error('[Backup Cron] Backup failed:', error);
      }
    });
    console.log(`[Backup Cron] Scheduled at ${settings.schedule}`);
  } else {
    console.log('[Backup Cron] Auto-backup is disabled.');
  }
}

// Function to restore database from JSON
import readline from 'readline';

export async function restoreDatabaseFromJson(jsonFilePath: string): Promise<void> {
  await connectToDatabase();
  const collections = mongoose.connection.collections;

  const fileStream = fs.createReadStream(jsonFilePath);

  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  let currentCollection = '';
  let docsBuffer: any[] = [];
  const BATCH_SIZE = 1000;

  const flushBuffer = async () => {
    if (currentCollection && collections[currentCollection] && docsBuffer.length > 0) {
      try {
        await collections[currentCollection].insertMany(docsBuffer);
      } catch (e) {
        console.error(`Error inserting into ${currentCollection}`, e);
      }
      docsBuffer = [];
    }
  };

  // We do a very naive parse line by line assuming the format we generated
  for await (const line of rl) {
    const trimmed = line.trim();
    if (!trimmed || trimmed === '{' || trimmed === '}') continue;

    // Check if new collection starts
    const colMatch = trimmed.match(/^"([^"]+)": \[$/);
    if (colMatch) {
      await flushBuffer();
      currentCollection = colMatch[1];
      if (collections[currentCollection]) {
        await collections[currentCollection].deleteMany({});
      }
      continue;
    }

    if (trimmed === ']' || trimmed === '],') {
      await flushBuffer();
      continue;
    }

    // Parse doc
    try {
      // Remove trailing comma if exists
      const jsonStr = trimmed.endsWith(',') ? trimmed.slice(0, -1) : trimmed;
      const doc = JSON.parse(jsonStr);
      docsBuffer.push(doc);
      if (docsBuffer.length >= BATCH_SIZE) {
        await flushBuffer();
      }
    } catch (e) {
      // Ignore parsing errors for intermediate structural characters
    }
  }

  await flushBuffer();
}

// Function to extract zip and restore
export async function restoreFromZip(zipFilePath: string): Promise<void> {
  const extractDir = path.join(TEMP_DIR, `extract-${Date.now()}`);
  fs.mkdirSync(extractDir, { recursive: true });

  return new Promise((resolve, reject) => {
    fs.createReadStream(zipFilePath)
      .pipe(unzip.Extract({ path: extractDir }))
      .on('close', async () => {
        try {
          // Restore uploads
          const extractedUploadsDir = path.join(extractDir, 'uploads');
          if (fs.existsSync(extractedUploadsDir)) {
             // Copy files back to uploads dir
             fs.cpSync(extractedUploadsDir, UPLOADS_DIR, { recursive: true, force: true });
          }

          // Restore DB
          const dbJsonPath = path.join(extractDir, 'database.json');
          if (fs.existsSync(dbJsonPath)) {
            await restoreDatabaseFromJson(dbJsonPath);
          }

          // Cleanup
          fs.rmSync(extractDir, { recursive: true, force: true });
          resolve();
        } catch (e) {
          reject(e);
        }
      })
      .on('error', reject);
  });
}
