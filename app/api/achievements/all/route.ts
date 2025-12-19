import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// GET: Fetch all available achievements
export async function GET(request: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch all achievements
    const { data: achievements, error } = await supabase
      .from('achievements')
      .select('*')
      .order('requirement_value', { ascending: true });

    if (error) throw error;

    return NextResponse.json({ achievements: achievements || [] });
  } catch (error: any) {
    console.error('Error fetching achievements:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch achievements' },
      { status: 500 }
    );
  }
}
