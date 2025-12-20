import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { rateLimit, RATE_LIMITS } from '@/lib/security/rate-limit';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const CreateAssessmentSchema = z.object({
  student_id: z.string().uuid(),
  assessment_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  weight: z.number().positive().optional().nullable(),
  height: z.number().positive().optional().nullable(),
  body_fat_percentage: z.number().min(0).max(100).optional().nullable(),
  muscle_mass: z.number().positive().optional().nullable(),
  body_water_percentage: z.number().min(0).max(100).optional().nullable(),
  bone_mass: z.number().positive().optional().nullable(),
  chest_circumference: z.number().positive().optional().nullable(),
  waist_circumference: z.number().positive().optional().nullable(),
  hip_circumference: z.number().positive().optional().nullable(),
  arm_circumference: z.number().positive().optional().nullable(),
  thigh_circumference: z.number().positive().optional().nullable(),
  calf_circumference: z.number().positive().optional().nullable(),
  triceps_skinfold: z.number().positive().optional().nullable(),
  biceps_skinfold: z.number().positive().optional().nullable(),
  subscapular_skinfold: z.number().positive().optional().nullable(),
  iliac_skinfold: z.number().positive().optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
  photos: z.array(z.string().url()).optional().nullable(),
});

const UpdateAssessmentSchema = CreateAssessmentSchema.extend({
  id: z.string().uuid(),
}).omit({ student_id: true });

const DeleteAssessmentSchema = z.object({
  id: z.string().uuid(),
});

/**
 * GET /api/assessments
 * List assessments for a student
 */
export async function GET(request: NextRequest) {
  try {
    const rateLimitResponse = rateLimit(
      request,
      RATE_LIMITS.read.maxRequests,
      RATE_LIMITS.read.windowMs
    );
    if (rateLimitResponse) return rateLimitResponse;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('student_id');

    if (!studentId) {
      return NextResponse.json(
        { error: 'student_id is required' },
        { status: 400 }
      );
    }

    // Verify access: personal trainer or student themselves
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role === 'personal') {
      // Verify student belongs to this personal
      const { data: student } = await supabase
        .from('students')
        .select('id')
        .eq('id', studentId)
        .eq('personal_id', user.id)
        .single();

      if (!student) {
        return NextResponse.json(
          { error: 'Student not found or access denied' },
          { status: 403 }
        );
      }
    } else if (profile?.role === 'student') {
      // Verify student is linked to this user
      const { data: student } = await supabase
        .from('students')
        .select('id')
        .eq('id', studentId)
        .eq('student_user_id', user.id)
        .single();

      if (!student) {
        return NextResponse.json(
          { error: 'Student not found or access denied' },
          { status: 403 }
        );
      }
    } else {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch assessments
    const { data: assessments, error } = await supabase
      .from('physical_assessments')
      .select('*')
      .eq('student_id', studentId)
      .order('assessment_date', { ascending: false });

    if (error) {
      console.error('[Assessments] Error fetching:', error);
      return NextResponse.json(
        { error: 'Failed to fetch assessments' },
        { status: 500 }
      );
    }

    return NextResponse.json({ assessments: assessments || [] });
  } catch (error: any) {
    console.error('[Assessments] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch assessments' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/assessments
 * Create a new assessment
 */
export async function POST(request: NextRequest) {
  try {
    const rateLimitResponse = rateLimit(
      request,
      RATE_LIMITS.write.maxRequests,
      RATE_LIMITS.write.windowMs
    );
    if (rateLimitResponse) return rateLimitResponse;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only personal trainers can create assessments
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'personal') {
      return NextResponse.json(
        { error: 'Only personal trainers can create assessments' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const result = CreateAssessmentSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: result.error.errors },
        { status: 400 }
      );
    }

    const data = result.data;

    // Verify student belongs to this personal
    const { data: student } = await supabase
      .from('students')
      .select('id, personal_id')
      .eq('id', data.student_id)
      .eq('personal_id', user.id)
      .single();

    if (!student) {
      return NextResponse.json(
        { error: 'Student not found or access denied' },
        { status: 403 }
      );
    }

    // Create assessment
    const assessmentData: any = {
      student_id: data.student_id,
      personal_id: user.id,
      assessment_date: data.assessment_date,
      created_by: user.id,
      photos: data.photos || [],
    };

    // Add optional fields only if provided
    if (data.weight !== undefined && data.weight !== null) assessmentData.weight = data.weight;
    if (data.height !== undefined && data.height !== null) assessmentData.height = data.height;
    if (data.body_fat_percentage !== undefined && data.body_fat_percentage !== null) 
      assessmentData.body_fat_percentage = data.body_fat_percentage;
    if (data.muscle_mass !== undefined && data.muscle_mass !== null) 
      assessmentData.muscle_mass = data.muscle_mass;
    if (data.body_water_percentage !== undefined && data.body_water_percentage !== null) 
      assessmentData.body_water_percentage = data.body_water_percentage;
    if (data.bone_mass !== undefined && data.bone_mass !== null) 
      assessmentData.bone_mass = data.bone_mass;
    if (data.chest_circumference !== undefined && data.chest_circumference !== null) 
      assessmentData.chest_circumference = data.chest_circumference;
    if (data.waist_circumference !== undefined && data.waist_circumference !== null) 
      assessmentData.waist_circumference = data.waist_circumference;
    if (data.hip_circumference !== undefined && data.hip_circumference !== null) 
      assessmentData.hip_circumference = data.hip_circumference;
    if (data.arm_circumference !== undefined && data.arm_circumference !== null) 
      assessmentData.arm_circumference = data.arm_circumference;
    if (data.thigh_circumference !== undefined && data.thigh_circumference !== null) 
      assessmentData.thigh_circumference = data.thigh_circumference;
    if (data.calf_circumference !== undefined && data.calf_circumference !== null) 
      assessmentData.calf_circumference = data.calf_circumference;
    if (data.triceps_skinfold !== undefined && data.triceps_skinfold !== null) 
      assessmentData.triceps_skinfold = data.triceps_skinfold;
    if (data.biceps_skinfold !== undefined && data.biceps_skinfold !== null) 
      assessmentData.biceps_skinfold = data.biceps_skinfold;
    if (data.subscapular_skinfold !== undefined && data.subscapular_skinfold !== null) 
      assessmentData.subscapular_skinfold = data.subscapular_skinfold;
    if (data.iliac_skinfold !== undefined && data.iliac_skinfold !== null) 
      assessmentData.iliac_skinfold = data.iliac_skinfold;
    if (data.notes !== undefined && data.notes !== null) 
      assessmentData.notes = data.notes.trim();

    const { data: assessment, error } = await supabase
      .from('physical_assessments')
      .insert(assessmentData)
      .select()
      .single();

    if (error) {
      console.error('[Assessments] Error creating:', {
        error,
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
        assessmentData,
      });

      // Check if table doesn't exist
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        return NextResponse.json(
          { 
            error: 'Tabela de avaliações não encontrada',
            details: 'A migration 010_physical_assessments.sql precisa ser executada no Supabase primeiro.',
            hint: 'Execute a migration no SQL Editor do Supabase Dashboard',
            code: error.code,
          },
          { status: 500 }
        );
      }

      // Check if it's an RLS policy error
      if (error.code === '42501' || error.message?.includes('permission denied') || error.message?.includes('policy')) {
        return NextResponse.json(
          { 
            error: 'Permissão negada: erro de política RLS',
            details: error.message,
            hint: 'Verifique se as políticas RLS foram criadas corretamente na migration',
            code: error.code,
          },
          { status: 403 }
        );
      }

      return NextResponse.json(
        { 
          error: 'Failed to create assessment', 
          details: error.message,
          hint: error.hint || 'Verifique os logs do servidor para mais detalhes',
          code: error.code,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ assessment }, { status: 201 });
  } catch (error: any) {
    console.error('[Assessments] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create assessment' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/assessments
 * Update an assessment
 */
export async function PATCH(request: NextRequest) {
  try {
    const rateLimitResponse = rateLimit(
      request,
      RATE_LIMITS.write.maxRequests,
      RATE_LIMITS.write.windowMs
    );
    if (rateLimitResponse) return rateLimitResponse;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only personal trainers can update assessments
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'personal') {
      return NextResponse.json(
        { error: 'Only personal trainers can update assessments' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const result = UpdateAssessmentSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: result.error.errors },
        { status: 400 }
      );
    }

    const { id, ...updateData } = result.data;

    // Verify assessment belongs to this personal
    const { data: assessment } = await supabase
      .from('physical_assessments')
      .select('id, personal_id')
      .eq('id', id)
      .eq('personal_id', user.id)
      .single();

    if (!assessment) {
      return NextResponse.json(
        { error: 'Assessment not found or access denied' },
        { status: 403 }
      );
    }

    // Build update object (only include provided fields)
    const update: any = {};
    if (updateData.assessment_date !== undefined) update.assessment_date = updateData.assessment_date;
    if (updateData.weight !== undefined) update.weight = updateData.weight;
    if (updateData.height !== undefined) update.height = updateData.height;
    if (updateData.body_fat_percentage !== undefined) update.body_fat_percentage = updateData.body_fat_percentage;
    if (updateData.muscle_mass !== undefined) update.muscle_mass = updateData.muscle_mass;
    if (updateData.body_water_percentage !== undefined) update.body_water_percentage = updateData.body_water_percentage;
    if (updateData.bone_mass !== undefined) update.bone_mass = updateData.bone_mass;
    if (updateData.chest_circumference !== undefined) update.chest_circumference = updateData.chest_circumference;
    if (updateData.waist_circumference !== undefined) update.waist_circumference = updateData.waist_circumference;
    if (updateData.hip_circumference !== undefined) update.hip_circumference = updateData.hip_circumference;
    if (updateData.arm_circumference !== undefined) update.arm_circumference = updateData.arm_circumference;
    if (updateData.thigh_circumference !== undefined) update.thigh_circumference = updateData.thigh_circumference;
    if (updateData.calf_circumference !== undefined) update.calf_circumference = updateData.calf_circumference;
    if (updateData.triceps_skinfold !== undefined) update.triceps_skinfold = updateData.triceps_skinfold;
    if (updateData.biceps_skinfold !== undefined) update.biceps_skinfold = updateData.biceps_skinfold;
    if (updateData.subscapular_skinfold !== undefined) update.subscapular_skinfold = updateData.subscapular_skinfold;
    if (updateData.iliac_skinfold !== undefined) update.iliac_skinfold = updateData.iliac_skinfold;
    if (updateData.notes !== undefined) update.notes = updateData.notes?.trim() || null;
    if (updateData.photos !== undefined) update.photos = updateData.photos || [];

    const { data: updatedAssessment, error } = await supabase
      .from('physical_assessments')
      .update(update)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[Assessments] Error updating:', error);
      return NextResponse.json(
        { error: 'Failed to update assessment', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ assessment: updatedAssessment });
  } catch (error: any) {
    console.error('[Assessments] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update assessment' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/assessments
 * Delete an assessment
 */
export async function DELETE(request: NextRequest) {
  try {
    const rateLimitResponse = rateLimit(
      request,
      RATE_LIMITS.write.maxRequests,
      RATE_LIMITS.write.windowMs
    );
    if (rateLimitResponse) return rateLimitResponse;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only personal trainers can delete assessments
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'personal') {
      return NextResponse.json(
        { error: 'Only personal trainers can delete assessments' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'id is required' },
        { status: 400 }
      );
    }

    // Verify assessment belongs to this personal
    const { data: assessment } = await supabase
      .from('physical_assessments')
      .select('id, personal_id')
      .eq('id', id)
      .eq('personal_id', user.id)
      .single();

    if (!assessment) {
      return NextResponse.json(
        { error: 'Assessment not found or access denied' },
        { status: 403 }
      );
    }

    const { error } = await supabase
      .from('physical_assessments')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('[Assessments] Error deleting:', error);
      return NextResponse.json(
        { error: 'Failed to delete assessment', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[Assessments] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete assessment' },
      { status: 500 }
    );
  }
}

