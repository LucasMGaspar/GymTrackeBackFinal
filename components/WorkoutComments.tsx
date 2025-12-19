'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/Toast';
import type { WorkoutComment } from '@/lib/types';

interface Props {
  sessionId: string;
  currentUserId: string;
  currentUserRole: 'student' | 'personal';
  onCommentAdded?: () => void;
}

export function WorkoutComments({ sessionId, currentUserId, currentUserRole, onCommentAdded }: Props) {
  const { showToast } = useToast();
  const [comments, setComments] = useState<WorkoutComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [showInput, setShowInput] = useState(false);

  useEffect(() => {
    fetchComments();
  }, [sessionId]);

  const fetchComments = async () => {
    try {
      const response = await fetch(`/api/comments?session_id=${sessionId}`);
      if (!response.ok) throw new Error('Failed to fetch comments');
      
      const data = await response.json();
      setComments(data.comments || []);
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setSubmitting(true);
    try {
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          content: newComment.trim(),
        }),
      });

      if (!response.ok) throw new Error('Failed to post comment');

      const data = await response.json();
      setComments([...comments, data.comment]);
      setNewComment('');
      setShowInput(false);
      showToast('Comentário adicionado! 💬', 'success');
      onCommentAdded?.();
    } catch (error) {
      showToast('Erro ao adicionar comentário', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    if (!confirm('Deletar este comentário?')) return;

    try {
      const response = await fetch('/api/comments', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: commentId }),
      });

      if (!response.ok) throw new Error('Failed to delete comment');

      setComments(comments.filter((c) => c.id !== commentId));
      showToast('Comentário deletado', 'success');
    } catch (error) {
      showToast('Erro ao deletar comentário', 'error');
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'agora';
    if (diffMins < 60) return `${diffMins}min atrás`;
    if (diffHours < 24) return `${diffHours}h atrás`;
    if (diffDays === 1) return 'ontem';
    if (diffDays < 7) return `${diffDays}d atrás`;
    
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
  };

  const getRoleBadge = (role: string) => {
    if (role === 'personal') {
      return (
        <span className="bg-indigo-100 text-indigo-700 text-xs font-bold px-2 py-0.5 rounded">
          PERSONAL
        </span>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-3">
        <div className="h-16 bg-gray-100 rounded-lg"></div>
        <div className="h-16 bg-gray-100 rounded-lg"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-gray-900 flex items-center gap-2">
          <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          Comentários
          {comments.length > 0 && (
            <span className="text-sm text-gray-500">({comments.length})</span>
          )}
        </h3>
        {!showInput && (
          <button
            onClick={() => setShowInput(true)}
            className="text-sm text-indigo-600 hover:text-indigo-700 font-semibold flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Adicionar
          </button>
        )}
      </div>

      {/* Comments List */}
      {comments.length === 0 && !showInput ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
          <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <p className="text-sm text-gray-500 mb-3">Nenhum comentário ainda</p>
          <button
            onClick={() => setShowInput(true)}
            className="text-sm text-indigo-600 hover:text-indigo-700 font-semibold"
          >
            Seja o primeiro a comentar
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {comments.map((comment) => (
            <div
              key={comment.id}
              className="bg-gray-50 rounded-lg p-4 border border-gray-200"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-bold">
                      {comment.author?.name?.charAt(0).toUpperCase() || '?'}
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-900">
                        {comment.author?.name || 'Usuário'}
                      </span>
                      {comment.author?.role && getRoleBadge(comment.author.role)}
                    </div>
                    <span className="text-xs text-gray-500">
                      {formatTime(comment.created_at)}
                    </span>
                  </div>
                </div>
                {comment.author_id === currentUserId && (
                  <button
                    onClick={() => handleDelete(comment.id)}
                    className="text-gray-400 hover:text-red-600 transition"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                )}
              </div>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{comment.content}</p>
            </div>
          ))}
        </div>
      )}

      {/* New Comment Form */}
      {showInput && (
        <form onSubmit={handleSubmit} className="space-y-3">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder={
              currentUserRole === 'personal'
                ? 'Deixe um feedback para seu aluno...'
                : 'Adicione suas observações sobre o treino...'
            }
            rows={3}
            maxLength={1000}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none"
            autoFocus
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">
              {newComment.length}/1000 caracteres
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowInput(false);
                  setNewComment('');
                }}
                className="px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={submitting || !newComment.trim()}
                className="px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Enviando...' : 'Comentar'}
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
