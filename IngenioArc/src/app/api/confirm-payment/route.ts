import { NextRequest, NextResponse } from 'next/server'
import { MiniAppPaymentSuccessPayload } from '@worldcoin/minikit-js'

interface IRequestPayload {
	payload: MiniAppPaymentSuccessPayload
}

export async function POST(req: NextRequest) {
    const { payload } = (await req.json()) as IRequestPayload

    // IMPORTANT: Here we should fetch the reference you created in /initiate-payment to ensure the transaction we are verifying is the same one we initiated
    const reference = await getReferenceFromDB(payload.reference)

    // 1. Check that the transaction we received from the mini app is the same one we sent
    if (payload.reference === reference) {
        const response = await fetch(
            `https://developer.worldcoin.org/api/v2/minikit/transaction/${payload.transaction_id}?app_id=${process.env.APP_ID}`,
            {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${process.env.DEV_PORTAL_API_KEY}`,
                },
            }
        )
        const transaction = await response.json()

        // 2. Here we optimistically confirm the transaction.
        // Otherwise, you can poll until the status == mined
        if (transaction.reference == reference && transaction.status != 'failed') {
            return NextResponse.json({ success: true })
        } else {
            return NextResponse.json({ success: false })
        }
    }
}

// Example implementation using an in-memory store (replace with your DB logic)
const referenceStore = new Map<string, string>()

export async function getReferenceFromDB(referenceId: string): Promise<string | undefined> {
    // Simulate fetching the reference from a database using the referenceId
    return referenceStore.get(referenceId)
}

