import fs from 'fs';
import path from 'path';

export interface BackupSettings {
  schedule: string; // e.g., '0 2 * * *'
  enabled: boolean;
  googleDriveFolderId: string;
  googleServiceAccountJson: string;
}

const SETTINGS_FILE = path.join(process.cwd(), 'backup-settings.json');

export const defaultBackupSettings: BackupSettings = {
  schedule: '0 2 * * *', // Every day at 2 AM
  enabled: false,
  googleDriveFolderId: '',
  googleServiceAccountJson: '',
};

export function getBackupSettings(): BackupSettings {
  if (fs.existsSync(SETTINGS_FILE)) {
    try {
      const data = fs.readFileSync(SETTINGS_FILE, 'utf8');
      return { ...defaultBackupSettings, ...JSON.parse(data) };
    } catch (e) {
      console.error('Error reading backup settings:', e);
    }
  }
  return defaultBackupSettings;
}

export function saveBackupSettings(settings: Partial<BackupSettings>): BackupSettings {
  const current = getBackupSettings();
  const updated = { ...current, ...settings };
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify(updated, null, 2), 'utf8');
  return updated;
}
