import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import { hasMinimumRole } from '@/server/permissions';
import { connectToDatabase } from '@/lib/db/mongoose';
import { Setting } from '@/models';

async function guard(){const u=await getSessionUser(); return u && hasMinimumRole(u.role,'ADMIN');}
export async function GET(){ if(!(await guard())) return NextResponse.json({error:'Forbidden'},{status:403}); await connectToDatabase(); return NextResponse.json({items: await Setting.find().sort({updatedAt:-1}).lean()}); }
export async function POST(req:Request){ if(!(await guard())) return NextResponse.json({error:'Forbidden'},{status:403}); const b=await req.json(); await connectToDatabase(); const item=await Setting.findOneAndUpdate({key:b.key},{value:b.value},{upsert:true,new:true}); return NextResponse.json({item}); }
