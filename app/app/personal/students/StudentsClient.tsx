'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { Student } from '@/lib/types';
import { EmptyState } from '@/components/EmptyState';
import { StudentModal } from './StudentModal';
import { DeleteConfirmModal } from '@/components/DeleteConfirmModal';

interface Props {
  initialStudents: Student[];
  personalId: string;
}

export function StudentsClient({ initialStudents, personalId }: Props) {
  const router = useRouter();
  const [students, setStudents] = useState(initialStudents);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [deletingStudent, setDeletingStudent] = useState<Student | null>(null);
  const [sendingInvite, setSendingInvite] = useState<string | null>(null);

  const filteredStudents = students.filter((student) => {
    const matchesSearch = 
      student.student_name.toLowerCase().includes(search.toLowerCase()) ||
      student.student_email.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || student.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleCreate = () => {
    setEditingStudent(null);
    setModalOpen(true);
  };

  const handleEdit = (student: Student) => {
    setEditingStudent(student);
    setModalOpen(true);
  };

  const handleDeleteClick = (student: Student) => {
    setDeletingStudent(student);
    setDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingStudent) return;

    try {
      const response = await fetch('/api/personal/students', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: deletingStudent.id }),
      });

      if (!response.ok) throw new Error('Failed to delete');

      setStudents(students.filter((s) => s.id !== deletingStudent.id));
      setDeleteModalOpen(false);
      setDeletingStudent(null);
    } catch (error) {
      alert('Erro ao deletar aluno');
    }
  };

  const handleToggleStatus = async (student: Student) => {
    const newStatus = student.status === 'active' ? 'inactive' : 'active';

    try {
      const response = await fetch('/api/personal/students', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          id: student.id,
          status: newStatus,
        }),
      });

      if (!response.ok) throw new Error('Failed to update');

      setStudents(students.map((s) => 
        s.id === student.id ? { ...s, status: newStatus } : s
      ));
    } catch (error) {
      alert('Erro ao atualizar status');
    }
  };

  const handleSendInvite = async (student: Student) => {
    if (student.status !== 'invited') {
      alert('Convite já foi aceito!');
      return;
    }

    setSendingInvite(student.id);

    try {
      const response = await fetch('/api/personal/invite-student', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId: student.id }),
      });

      if (!response.ok) throw new Error('Failed to send invite');

      alert(`Convite enviado para ${student.student_email}!`);
    } catch (error) {
      alert('Erro ao enviar convite');
    } finally {
      setSendingInvite(null);
    }
  };

  const handleSave = () => {
    setModalOpen(false);
    router.refresh();
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      invited: 'bg-yellow-100 text-yellow-800',
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-800',
    };

    const labels = {
      invited: 'Convidado',
      active: 'Ativo',
      inactive: 'Inativo',
    };

    return (
      <span className={`px-2 py-1 text-xs font-semibold rounded ${styles[status as keyof typeof styles]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    );
  };

  const statusCounts = {
    all: students.length,
    invited: students.filter(s => s.status === 'invited').length,
    active: students.filter(s => s.status === 'active').length,
    inactive: students.filter(s => s.status === 'inactive').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Alunos</h1>
          <p className="text-gray-600 text-sm mt-1">
            {students.length} aluno{students.length !== 1 ? 's' : ''} cadastrado{students.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-5 py-2.5 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Novo Aluno
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4 space-y-4">
        {/* Search */}
        <div>
          <input
            type="text"
            placeholder="🔍 Buscar aluno..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
        </div>

        {/* Status Filter */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {[
            { key: 'all', label: 'Todos' },
            { key: 'active', label: 'Ativos' },
            { key: 'invited', label: 'Convidados' },
            { key: 'inactive', label: 'Inativos' },
          ].map((filter) => (
            <button
              key={filter.key}
              onClick={() => setStatusFilter(filter.key)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-all duration-200 ${
                statusFilter === filter.key
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {filter.label} ({statusCounts[filter.key as keyof typeof statusCounts]})
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {filteredStudents.length === 0 ? (
        students.length === 0 ? (
          <EmptyState
            title="Nenhum aluno cadastrado"
            description="Comece adicionando seus alunos. Você poderá criar treinos personalizados para cada um."
            action={{
              label: '+ Adicionar Primeiro Aluno',
              onClick: handleCreate,
            }}
          />
        ) : (
          <EmptyState
            title="Nenhum aluno encontrado"
            description="Tente ajustar os filtros ou busca."
          />
        )
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStudents.map((student) => (
            <div
              key={student.id}
              className="group bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg hover:border-indigo-100 transition-all duration-200"
            >
              {/* Header com gradiente */}
              <div className="bg-gradient-to-r from-indigo-500 to-purple-500 px-5 py-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-white text-lg truncate">{student.student_name}</h3>
                    <p className="text-sm text-white opacity-90 truncate mt-1">{student.student_email}</p>
                  </div>
                  <div className="ml-3">
                    {getStatusBadge(student.status)}
                  </div>
                </div>
              </div>

              {/* Body */}
              <div className="p-5 space-y-3">
                {/* Quick Links */}
                <div className="grid grid-cols-2 gap-3">
                  <Link
                    href={`/app/personal/students/${student.id}/templates`}
                    className="flex items-center justify-center gap-2 text-center text-sm bg-green-50 hover:bg-green-100 text-green-700 py-2.5 rounded-lg font-semibold transition"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Templates
                  </Link>
                  <Link
                    href={`/app/personal/students/${student.id}/history`}
                    className="flex items-center justify-center gap-2 text-center text-sm bg-blue-50 hover:bg-blue-100 text-blue-700 py-2.5 rounded-lg font-semibold transition"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    Histórico
                  </Link>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(student)}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-indigo-50 text-indigo-700 rounded-lg font-semibold text-sm hover:bg-indigo-100 transition"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Editar
                  </button>
                  <button
                    onClick={() => handleToggleStatus(student)}
                    disabled={student.status === 'invited'}
                    className="flex-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg font-semibold text-sm hover:bg-gray-200 transition disabled:opacity-50"
                  >
                    {student.status === 'active' ? 'Desativar' : 'Ativar'}
                  </button>
                  <button
                    onClick={() => handleDeleteClick(student)}
                    className="px-3 py-2 bg-red-50 text-red-700 rounded-lg font-semibold text-sm hover:bg-red-100 transition"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>

                {/* Invite Button */}
                {student.status === 'invited' && (
                  <button
                    onClick={() => handleSendInvite(student)}
                    disabled={sendingInvite === student.id}
                    className="w-full flex items-center justify-center gap-2 text-sm bg-yellow-50 hover:bg-yellow-100 text-yellow-800 py-2.5 rounded-lg font-semibold transition disabled:opacity-50"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    {sendingInvite === student.id ? 'Enviando...' : 'Reenviar Convite'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      {modalOpen && (
        <StudentModal
          personalId={personalId}
          student={editingStudent}
          onClose={() => setModalOpen(false)}
          onSave={handleSave}
        />
      )}

      {deleteModalOpen && deletingStudent && (
        <DeleteConfirmModal
          title="Deletar Aluno"
          message={`Tem certeza que deseja deletar "${deletingStudent.student_name}"? Todos os treinos e dados deste aluno serão perdidos. Esta ação não pode ser desfeita.`}
          onConfirm={handleDelete}
          onCancel={() => {
            setDeleteModalOpen(false);
            setDeletingStudent(null);
          }}
        />
      )}
    </div>
  );
}
