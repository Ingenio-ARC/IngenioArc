import { NextRequest, NextResponse } from 'next/server'
import { verifyCloudProof, IVerifyResponse, ISuccessResult, MiniKit } from '@worldcoin/minikit-js'
import { supabase } from '../../../../lib/db';
import { auth } from '@/auth';

interface IRequestPayload {
	payload: ISuccessResult
	action: string
	signal: string | undefined
}

export async function POST(req: NextRequest) {
	const { payload, action, signal } = (await req.json()) as IRequestPayload
	const app_id = process.env.APP_ID as `app_${string}`
	const verifyRes = (await verifyCloudProof(payload, app_id, action, signal)) as IVerifyResponse // Wrapper on this

	if (verifyRes.success) {
    const session = await auth();
    const world_nickname = session?.user.username;
    console.log('world_nickname:', world_nickname);
    
	if (typeof world_nickname === 'string' && world_nickname.length > 0) {
      // 1. Buscar el usuario en la tabla users
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('user_id')
        .eq('world_nickname', world_nickname)
        .single();
		  console.log(userData, userError);		
      if (userError || !userData) {
        return NextResponse.json({ redirect: '/select_profile', status: 200 });
      }

      const user_id = userData.user_id;

      // 2. Buscar en speakers
      const { data: speakerData } = await supabase
        .from('speakers')
        .select('speaker_id')
        .eq('user_id', user_id)
        .single();
			console.log(userData, userError);
      if (speakerData) {
        return NextResponse.json({ redirect: '/main_speaker', status: 200 });
      }

      // 3. Buscar en listeners
      const { data: listenerData } = await supabase
        .from('listeners')
        .select('listener_id')
        .eq('user_id', user_id)
        .single();
	  	console.log(userData, userError);
      if (listenerData) {
        return NextResponse.json({ redirect: '/main_listener', status: 200 });
      }

      // 4. No encontrado en ninguna tabla
      return NextResponse.json({ redirect: '/select_profile', status: 200 });
    } else {
      return NextResponse.json({ redirect: '/select_profile', status: 200 });
    }
  } else {
    return NextResponse.json({ error: 'Verification failed', status: 400 });
  }
}