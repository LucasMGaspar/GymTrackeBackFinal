import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { rateLimit, RATE_LIMITS } from '@/lib/security/rate-limit';

// Dynamic import to avoid build-time issues with jsPDF
const generateMonthlyReport = async (data: any) => {
  const { generateMonthlyReport: generate } = await import('@/lib/reports/generateMonthlyReport');
  return generate(data);
};

export async function POST(request: Request) {
  try {
    // Rate limiting
    const rateLimitResponse = rateLimit(
      request as NextRequest,
      RATE_LIMITS.read.maxRequests,
      RATE_LIMITS.read.windowMs
    );
    if (rateLimitResponse) return rateLimitResponse;

    const supabase = await createClient();
    const body = await request.json();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, name')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'personal') {
      return NextResponse.json({ error: 'Only personal trainers can generate reports' }, { status: 403 });
    }

    const { student_id, month, year } = body;

    if (!student_id || !month || !year) {
      return NextResponse.json(
        { error: 'student_id, month, and year are required' },
        { status: 400 }
      );
    }

    // Verify student belongs to this personal
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('*')
      .eq('id', student_id)
      .eq('personal_id', user.id)
      .single();

    if (studentError || !student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    // Check if student is linked to a user
    if (!student.student_user_id) {
      return NextResponse.json(
        { error: 'Aluno ainda não aceitou o convite. Não há treinos para gerar relatório.' },
        { status: 400 }
      );
    }

    // Calculate date range
    const periodStart = new Date(year, month - 1, 1);
    const periodEnd = new Date(year, month, 0);
    periodEnd.setHours(23, 59, 59, 999);

    // Fetch sessions for the month
    // Use student_user_id (workout_sessions uses student_user_id, not student_id)
    const { data: sessions, error: sessionsError } = await supabase
      .from('workout_sessions')
      .select(`
        *,
        template:workout_templates(*),
        workout_session_exercises(
          *,
          exercise:exercises(*)
        )
      `)
      .eq('student_user_id', student.student_user_id)
      .eq('status', 'completed')
      .gte('session_date', periodStart.toISOString().split('T')[0])
      .lte('session_date', periodEnd.toISOString().split('T')[0])
      .order('session_date', { ascending: false });

    if (sessionsError) {
      console.error('Error fetching sessions:', sessionsError);
      return NextResponse.json(
        { error: 'Failed to fetch sessions' },
        { status: 500 }
      );
    }

    // Generate PDF (dynamic import to avoid build issues)
    const pdf = await generateMonthlyReport({
      student,
      personalName: profile.name,
      sessions: sessions || [],
      periodStart,
      periodEnd,
    });

    // Convert PDF to buffer
    const pdfBuffer = Buffer.from(pdf.output('arraybuffer'));

    // Create filename
    const monthName = periodStart.toLocaleDateString('pt-BR', { month: 'long' });
    const filename = `relatorio-${student.student_name.replace(/\s+/g, '-').toLowerCase()}-${monthName}-${year}.pdf`;

    // Return PDF
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error: any) {
    console.error('Error generating report:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate report' },
      { status: 500 }
    );
  }
}
