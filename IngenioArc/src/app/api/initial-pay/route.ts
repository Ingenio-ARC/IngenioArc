import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../../../lib/db'

export async function POST(req: NextRequest) {
    const uuid = crypto.randomUUID().replace(/-/g, '')

    // Inserta el registro en la tabla payments solo con el payment_id
    const { error } = await supabase
        .from('payments')
        .insert([{ payment_id: uuid }])

    if (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ id: uuid })
}