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
		// This is where you should perform backend actions if the verification succeeds
		// Such as, setting a user as "verified" in a database
    const session = await auth();
    const world_nickname = session?.user.username;
    console.log('world_nickname:', world_nickname);
    
	if (typeof world_nickname === 'string' && world_nickname.length > 0) {
		await supabase
      .from('users')
      .insert([{ world_nickname, created_at: new Date().toISOString() }]);
		console.log('User added to database:', world_nickname);
	} else {
		console.error('Invalid world_nickname:', world_nickname);
		return NextResponse.json({ error: 'Invalid world_nickname', status: 400 });
	}
		return NextResponse.json({ verifyRes, status: 200 })
	} else {
		// This is where you should handle errors from the World ID /verify endpoint.
		// Usually these errors are due to a user having already verified.
		return NextResponse.json({ verifyRes, status: 400 })
	}
}