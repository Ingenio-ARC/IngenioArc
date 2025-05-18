import { NextRequest, NextResponse } from 'next/server'
import { MiniAppPaymentSuccessPayload } from '@worldcoin/minikit-js'
import { supabase } from '../../../../lib/db'

export async function POST(req: NextRequest) {
    try {
        const payload = (await req.json()) as MiniAppPaymentSuccessPayload;
        console.log('PAYLOAD RECIBIDO:', payload);
        if (!payload || !payload.reference) {
            return NextResponse.json({ success: false, error: 'Invalid payload' }, { status: 400 });
        }

        // Buscar el payment_id en la tabla payments usando reference_payload
        const { data: paymentData, error: paymentError } = await supabase
            .from('payments')
            .select('reference_payload')
            .eq('reference_payload', payload.reference)
            .single();

        console.log('PAYMENT DATA FROM DB:', paymentData);
        console.log('REFERENCE FROM PAYLOAD:', payload.reference);

        if (!paymentData || paymentError) {
            return NextResponse.json({ success: false, error: 'Reference not found in payments' }, { status: 400 });
        }

        // 1. Check that the transaction we received from the mini app is the same one we sent
        if (payload.reference === paymentData.reference_payload) {
            const response = await fetch(
                `https://developer.worldcoin.org/api/v2/minikit/transaction/${payload.transaction_id}?app_id=${process.env.APP_ID}`,
                {
                    method: 'GET',
                    headers: {
                        Authorization: `Bearer ${process.env.DEV_PORTAL_API_KEY}`,
                    },
                }
            );
            const transaction = await response.json();

            // 2. Here we optimistically confirm the transaction.
            // Otherwise, you can poll until the status == mined
            if (transaction.reference == paymentData.reference_payload && transaction.status != 'failed') {
                return NextResponse.json({ success: true });
            } else {
                return NextResponse.json({ success: false });
            }
        } else {
            return NextResponse.json({ success: false, error: 'Reference mismatch' }, { status: 400 });
        }
    } catch (e) {
        return NextResponse.json({ success: false, error: (e as Error).message }, { status: 500 });
    }
}

