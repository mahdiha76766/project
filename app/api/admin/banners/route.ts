import { NextResponse } from 'next/server';
import { Banner } from '@/models';
import { connectToDatabase } from '@/lib/db/mongoose';
import { getSessionUser } from '@/lib/auth/session';
import { hasMinimumRole } from '@/server/permissions';
async function guard(){const u=await getSessionUser(); return u && hasMinimumRole(u.role,'ADMIN');}
export async function GET(){ if(!(await guard())) return NextResponse.json({error:'Forbidden'},{status:403}); await connectToDatabase(); return NextResponse.json({items: await Banner.find().sort({createdAt:-1}).lean()}); }
export async function POST(req:Request){ if(!(await guard())) return NextResponse.json({error:'Forbidden'},{status:403}); const b=await req.json(); await connectToDatabase(); const item=await Banner.create({title:b.title,image:b.image,link:b.link||'/',position:b.position||'home',isActive:b.isActive??true}); return NextResponse.json({item},{status:201}); }
