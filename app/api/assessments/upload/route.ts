import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { rateLimit, RATE_LIMITS } from '@/lib/security/rate-limit';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

/**
 * POST /api/assessments/upload
 * Upload a photo for an assessment
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

    // Verificar se é personal trainer
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'personal') {
      return NextResponse.json(
        { error: 'Only personal trainers can upload photos' },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const assessmentId = formData.get('assessmentId') as string;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validações
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File size exceeds 5MB limit' },
        { status: 400 }
      );
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only JPEG, PNG and WebP are allowed' },
        { status: 400 }
      );
    }

    // Verificar se a avaliação pertence a este personal (se assessmentId fornecido)
    if (assessmentId) {
      const { data: assessment } = await supabase
        .from('physical_assessments')
        .select('id, personal_id')
        .eq('id', assessmentId)
        .eq('personal_id', user.id)
        .single();

      if (!assessment) {
        return NextResponse.json(
          { error: 'Assessment not found or access denied' },
          { status: 403 }
        );
      }
    }

    // Gerar nome único para o arquivo
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `${user.id}/${fileName}`;

    // Converter File para ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload para Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('assessment-photos')
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error('[Upload] Error:', uploadError);
      return NextResponse.json(
        { error: 'Failed to upload file', details: uploadError.message },
        { status: 500 }
      );
    }

    // Para bucket privado, precisamos gerar uma signed URL
    // Válida por 1 ano (31536000 segundos) para que não expire rapidamente
    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from('assessment-photos')
      .createSignedUrl(filePath, 31536000); // 1 ano

    if (signedUrlError || !signedUrlData?.signedUrl) {
      console.error('[Upload] Error creating signed URL:', signedUrlError);
      // Fallback para public URL (caso o bucket seja público ou políticas permitam)
      const { data: { publicUrl } } = supabase.storage
        .from('assessment-photos')
        .getPublicUrl(filePath);
      
      console.log('[Upload] Using public URL as fallback:', publicUrl);
      
      return NextResponse.json({
        url: publicUrl,
        path: filePath,
      });
    }

    console.log('[Upload] File uploaded successfully:', {
      filePath,
      signedUrl: signedUrlData.signedUrl,
      userId: user.id,
    });

    return NextResponse.json({
      url: signedUrlData.signedUrl,
      path: filePath,
    });
  } catch (error: any) {
    console.error('[Upload] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to upload file' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/assessments/upload
 * Delete a photo from storage
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

    const { searchParams } = new URL(request.url);
    const filePath = searchParams.get('path');

    if (!filePath) {
      return NextResponse.json(
        { error: 'File path is required' },
        { status: 400 }
      );
    }

    // Verificar se o arquivo pertence a este usuário
    if (!filePath.startsWith(`${user.id}/`)) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    const { error } = await supabase.storage
      .from('assessment-photos')
      .remove([filePath]);

    if (error) {
      console.error('[Upload] Delete error:', error);
      return NextResponse.json(
        { error: 'Failed to delete file', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[Upload] Delete error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete file' },
      { status: 500 }
    );
  }
}

