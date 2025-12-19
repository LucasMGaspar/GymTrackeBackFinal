import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// GET: Fetch student achievements
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('student_id');

    if (!studentId) {
      return NextResponse.json(
        { error: 'student_id is required' },
        { status: 400 }
      );
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch achievements with details
    const { data: achievements, error } = await supabase
      .from('student_achievements')
      .select(
        `
        *,
        achievement:achievements(*)
      `
      )
      .eq('student_id', studentId)
      .order('earned_at', { ascending: false });

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
