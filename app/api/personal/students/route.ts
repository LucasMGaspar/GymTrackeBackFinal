import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { rateLimit, RATE_LIMITS } from '@/lib/security/rate-limit';

// Force dynamic rendering to avoid build-time analysis
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const CreateStudentSchema = z.object({
  personal_id: z.string().uuid(),
  student_name: z.string().min(1),
  student_email: z.string().email(),
  send_invite: z.boolean().optional(),
});

const UpdateStudentSchema = z.object({
  id: z.string().uuid(),
  student_name: z.string().min(1).optional(),
  student_email: z.string().email().optional(),
  status: z.enum(['invited', 'active', 'inactive']).optional(),
});

const DeleteStudentSchema = z.object({
  id: z.string().uuid(),
});

// GET - List students
export async function GET(request: Request) {
  try {
    // Rate limiting
    const rateLimitResponse = rateLimit(
      request as NextRequest,
      RATE_LIMITS.read.maxRequests,
      RATE_LIMITS.read.windowMs
    );
    if (rateLimitResponse) return rateLimitResponse;

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: students, error } = await supabase
      .from('students')
      .select('*')
      .eq('personal_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ students });
  } catch (error) {
    console.error('Get students error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch students' },
      { status: 500 }
    );
  }
}

// POST - Create student
export async function POST(request: Request) {
  try {
    // Rate limiting
    const rateLimitResponse = rateLimit(
      request as NextRequest,
      RATE_LIMITS.write.maxRequests,
      RATE_LIMITS.write.windowMs
    );
    if (rateLimitResponse) return rateLimitResponse;

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validated = CreateStudentSchema.parse(body);

    // Verify personal_id matches user
    if (validated.personal_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check if email already exists for this personal
    const { data: existing } = await supabase
      .from('students')
      .select('id')
      .eq('personal_id', user.id)
      .eq('student_email', validated.student_email)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: 'Aluno com este email já cadastrado' },
        { status: 400 }
      );
    }

    // Create student
    const { data: student, error } = await supabase
      .from('students')
      .insert({
        personal_id: validated.personal_id,
        student_name: validated.student_name,
        student_email: validated.student_email,
        status: 'invited',
      })
      .select()
      .single();

    if (error) throw error;

    // Send invite if requested
    if (validated.send_invite) {
      try {
        const inviteResponse = await fetch(
          `${request.headers.get('origin')}/api/personal/invite-student`,
          {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Cookie': request.headers.get('cookie') || '',
            },
            body: JSON.stringify({ studentId: student.id }),
          }
        );

        if (!inviteResponse.ok) {
          console.error('Failed to send invite automatically');
        }
      } catch (inviteError) {
        console.error('Error sending invite:', inviteError);
        // Don't fail the whole request if invite fails
      }
    }

    return NextResponse.json({ student }, { status: 201 });
  } catch (error) {
    console.error('Create student error:', error);
    return NextResponse.json(
      { error: 'Failed to create student' },
      { status: 500 }
    );
  }
}

// PUT - Update student
export async function PUT(request: Request) {
  try {
    // Rate limiting
    const rateLimitResponse = rateLimit(
      request as NextRequest,
      RATE_LIMITS.write.maxRequests,
      RATE_LIMITS.write.windowMs
    );
    if (rateLimitResponse) return rateLimitResponse;

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validated = UpdateStudentSchema.parse(body);

    // Verify student belongs to user
    const { data: existing } = await supabase
      .from('students')
      .select('id')
      .eq('id', validated.id)
      .eq('personal_id', user.id)
      .single();

    if (!existing) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    // Build update object (only include provided fields)
    const updateData: any = {};
    if (validated.student_name) updateData.student_name = validated.student_name;
    if (validated.student_email) updateData.student_email = validated.student_email;
    if (validated.status) updateData.status = validated.status;

    const { data: student, error } = await supabase
      .from('students')
      .update(updateData)
      .eq('id', validated.id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ student });
  } catch (error) {
    console.error('Update student error:', error);
    return NextResponse.json(
      { error: 'Failed to update student' },
      { status: 500 }
    );
  }
}

// DELETE - Delete student
export async function DELETE(request: Request) {
  try {
    // Rate limiting
    const rateLimitResponse = rateLimit(
      request as NextRequest,
      RATE_LIMITS.write.maxRequests,
      RATE_LIMITS.write.windowMs
    );
    if (rateLimitResponse) return rateLimitResponse;

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validated = DeleteStudentSchema.parse(body);

    const { error } = await supabase
      .from('students')
      .delete()
      .eq('id', validated.id)
      .eq('personal_id', user.id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete student error:', error);
    return NextResponse.json(
      { error: 'Failed to delete student' },
      { status: 500 }
    );
  }
}
