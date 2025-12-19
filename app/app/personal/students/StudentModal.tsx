'use client';

import { useState, useEffect } from 'react';
import type { Student } from '@/lib/types';
import { z } from 'zod';

interface Props {
  personalId: string;
  student: Student | null;
  onClose: () => void;
  onSave: () => void;
}

const StudentSchema = z.object({
  student_name: z.string().min(1, 'Nome é obrigatório'),
  student_email: z.string().email('Email inválido'),
});

export function StudentModal({ personalId, student, onClose, onSave }: Props) {
  const [name, setName] = useState(student?.student_name || '');
  const [email, setEmail] = useState(student?.student_email || '');
  const [sendInvite, setSendInvite] = useState(!student);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validate
    const result = StudentSchema.safeParse({
      student_name: name.trim(),
      student_email: email.trim(),
    });

    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0].toString()] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);

    try {
      const method = student ? 'PUT' : 'POST';
      const body = student
        ? { 
            id: student.id, 
            student_name: result.data.student_name,
            student_email: result.data.student_email,
          }
        : { 
            personal_id: personalId, 
            student_name: result.data.student_name,
            student_email: result.data.student_email,
            send_invite: sendInvite,
          };

      const response = await fetch('/api/personal/students', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save');
      }

      onSave();
    } catch (error: any) {
      // Inline error display - no toast needed as modal shows errors
      setErrors({ general: error.message || 'Erro ao salvar aluno' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900">
            {student ? 'Editar Aluno' : 'Novo Aluno'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            disabled={loading}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* General Error */}
          {errors.general && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-800">{errors.general}</p>
            </div>
          )}
          
          {/* Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Nome do Aluno *
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: João Silva"
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none ${
                errors.student_name ? 'border-red-500' : 'border-gray-300'
              }`}
              disabled={loading}
            />
            {errors.student_name && (
              <p className="text-red-600 text-sm mt-1">{errors.student_name}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email *
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="joao@email.com"
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none ${
                errors.student_email ? 'border-red-500' : 'border-gray-300'
              }`}
              disabled={loading || !!student}
            />
            {errors.student_email && (
              <p className="text-red-600 text-sm mt-1">{errors.student_email}</p>
            )}
            {student && (
              <p className="text-xs text-gray-500 mt-1">
                Email não pode ser alterado após cadastro
              </p>
            )}
          </div>

          {/* Send Invite Checkbox */}
          {!student && (
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="sendInvite"
                checked={sendInvite}
                onChange={(e) => setSendInvite(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              />
              <label htmlFor="sendInvite" className="text-sm text-gray-700">
                Enviar convite por email automaticamente
              </label>
            </div>
          )}

          {/* Info */}
          {!student && sendInvite && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-xs text-blue-800">
                📧 O aluno receberá um email com um link mágico para criar a conta e acessar os treinos.
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
