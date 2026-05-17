import { NextResponse } from 'next/server'; import { User } from '@/models'; import { connectToDatabase } from '@/lib/db/mongoose'; import { getSessionUser } from '@/lib/auth/session'; import { hasMinimumRole } from '@/server/permissions';
async function guard(){const u=await getSessionUser(); return u && hasMinimumRole(u.role,'ADMIN');}
export async function GET(){ if(!(await guard())) return NextResponse.json({error:'Forbidden'},{status:403}); await connectToDatabase(); return NextResponse.json({items: await User.find().select('-password').sort({createdAt:-1}).lean()}); }
