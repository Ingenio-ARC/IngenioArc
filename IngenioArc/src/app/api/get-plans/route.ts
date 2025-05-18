import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../../lib/db';

export async function GET(req: NextRequest) {
  const { data, error } = await supabase
    .from('plans')
    .select('*')
    .gt('plan_id', 0); // Solo planes con plan_id > 1

  console.log('Data:', data);
  console.log('Error:', error);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ plans: data }, { status: 200 });
}