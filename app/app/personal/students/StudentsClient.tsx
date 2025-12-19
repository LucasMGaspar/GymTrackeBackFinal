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
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition"
        >
          + Novo Aluno
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
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition ${
                statusFilter === filter.key
                  ? 'bg-blue-600 text-white'
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredStudents.map((student) => (
            <div
              key={student.id}
              className="bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{student.student_name}</h3>
                  <p className="text-sm text-gray-600">{student.student_email}</p>
                </div>
                {getStatusBadge(student.status)}
              </div>

              <div className="space-y-2">
                {/* Quick Links */}
                <div className="grid grid-cols-2 gap-2">
                  <Link
                    href={`/app/personal/students/${student.id}/templates`}
                    className="block text-center text-xs bg-green-100 hover:bg-green-200 text-green-800 py-2 rounded font-medium transition"
                  >
                    📋 Templates
                  </Link>
                  <Link
                    href={`/app/personal/students/${student.id}/history`}
                    className="block text-center text-xs bg-blue-100 hover:bg-blue-200 text-blue-800 py-2 rounded font-medium transition"
                  >
                    📊 Histórico
                  </Link>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(student)}
                    className="flex-1 text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleToggleStatus(student)}
                    className="flex-1 text-sm text-gray-600 hover:text-gray-700 font-medium"
                    disabled={student.status === 'invited'}
                  >
                    {student.status === 'active' ? 'Desativar' : 'Ativar'}
                  </button>
                  <button
                    onClick={() => handleDeleteClick(student)}
                    className="flex-1 text-sm text-red-600 hover:text-red-700 font-medium"
                  >
                    Deletar
                  </button>
                </div>

                {/* Invite Button */}
                {student.status === 'invited' && (
                  <button
                    onClick={() => handleSendInvite(student)}
                    disabled={sendingInvite === student.id}
                    className="w-full text-sm bg-yellow-100 hover:bg-yellow-200 text-yellow-800 py-2 rounded font-medium transition disabled:opacity-50"
                  >
                    {sendingInvite === student.id ? 'Enviando...' : '📧 Reenviar Convite'}
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
