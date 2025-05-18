import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../../../lib/db'

export async function POST(req: NextRequest) {
    const {
        world_nickname, // string
        from,           // sender_wallet: string
        name_plan,        // string o number
        timestamp,      // string (fecha)
        reference,      // string (referencia de pago)
    } = await req.json();

    // 1. Buscar el user_id usando el world_nickname
    const { data: userData, error: userError } = await supabase
        .from('users')
        .select('user_id')
        .eq('world_nickname', world_nickname)
        .single();

    if (userError || !userData) {
        return NextResponse.json({ success: false, error: 'User not found' }, { status: 400 });
    }

    // 2. Obtener el amount del plan
    const { data: planData, error: planError } = await supabase
        .from('plans')
        .select('price_plan')
        .eq('name_plan', name_plan)
        .single();

    if (planError || !planData) {
        return NextResponse.json({ success: false, error: 'Plan not found' }, { status: 400 });
    }

    // 3. Insertar el registro en payments
    const { error: insertError } = await supabase
        .from('payments')
        .insert([{
            payment_id: reference, // o usa uuid si lo prefieres
            user_id: userData.user_id,
            sender_wallet: from,
            amount: planData.price_plan,
            created_at: timestamp,
            reference_payload: reference
        }]);

    if (insertError) {
        return NextResponse.json({ success: false, error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
}