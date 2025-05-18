import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../../../lib/db';
import { auth } from '@/auth';

interface IRequestPayload {
  role: 'listener' | 'speaker'
}

export async function POST(req: NextRequest) {
  const { role } = (await req.json()) as IRequestPayload;
  const session = await auth();
  const world_nickname = session?.user.username;
    console.log('world_nickname recibido:', world_nickname, typeof world_nickname);
  if (typeof world_nickname === 'string' && world_nickname.length > 0) {
    // 1. Buscar el usuario en la tabla users
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('user_id')
      .eq('world_nickname', world_nickname)
      .single();
    console.log(userData, userError);
    if (userError || !userData) {
      return NextResponse.json({ error: 'User not found', status: 404 });
    }

    // 2. Insertar en la tabla correspondiente
    const table = role === 'listener' ? 'listeners' : 'speakers';
    const { error: insertError } = await supabase
      .from(table)
      .insert([{ user_id: userData.user_id, conversation_count: 0 }]);

    if (insertError) {
      return NextResponse.json({ error: 'Insert failed', status: 500 });
    }

    return NextResponse.json({ message: 'User created', status: 200 });
  } else {
    return NextResponse.json({ error: 'Invalid world_nickname', status: 400 });
  }
}