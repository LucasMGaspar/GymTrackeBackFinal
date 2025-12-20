import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { isValidUUID, sanitizeContent } from '@/lib/security/sanitize';
import { rateLimit, RATE_LIMITS } from '@/lib/security/rate-limit';

const CreateCommentSchema = z.object({
  session_id: z.string().uuid(),
  content: z.string().min(1).max(1000),
});

const DeleteCommentSchema = z.object({
  id: z.string().uuid(),
});

// GET: Fetch comments for a session
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
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('session_id');

    if (!sessionId) {
      return NextResponse.json(
        { error: 'session_id is required' },
        { status: 400 }
      );
    }

    // Validar formato UUID
    if (!isValidUUID(sessionId)) {
      return NextResponse.json(
        { error: 'Invalid session_id format' },
        { status: 400 }
      );
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch comments with author info
    const { data: comments, error } = await supabase
      .from('workout_comments')
      .select(
        `
        *,
        author:profiles!workout_comments_author_id_fkey(id, name, role)
      `
      )
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    if (error) throw error;

    return NextResponse.json({ comments: comments || [] });
  } catch (error: any) {
    console.error('Error fetching comments:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch comments' },
      { status: 500 }
    );
  }
}

// POST: Create a new comment
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
    const body = await request.json();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Validate input
    const result = CreateCommentSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: result.error.errors },
        { status: 400 }
      );
    }

    const { session_id, content } = result.data;

    // Sanitizar conteúdo antes de inserir
    const sanitizedContent = sanitizeContent(content.trim());

    // Insert comment
    const { data: comment, error } = await supabase
      .from('workout_comments')
      .insert({
        session_id,
        author_id: user.id,
        content: sanitizedContent,
      })
      .select(
        `
        *,
        author:profiles!workout_comments_author_id_fkey(id, name, role)
      `
      )
      .single();

    if (error) throw error;

    return NextResponse.json({ comment }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating comment:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create comment' },
      { status: 500 }
    );
  }
}

// DELETE: Delete a comment
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
    const body = await request.json();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Validate input
    const result = DeleteCommentSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: result.error.errors },
        { status: 400 }
      );
    }

    const { id } = result.data;

    // Delete comment (RLS will ensure user owns it)
    const { error } = await supabase
      .from('workout_comments')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting comment:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete comment' },
      { status: 500 }
    );
  }
}
