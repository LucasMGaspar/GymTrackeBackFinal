'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useToast } from '@/components/ui/Toast';
import { GenerateReportButton } from '@/components/GenerateReportButton';
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
  const { showToast } = useToast();
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
      showToast('Aluno deletado com sucesso', 'success');
    } catch (error) {
      showToast('Erro ao deletar aluno', 'error');
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
      showToast(`Aluno ${newStatus === 'active' ? 'ativado' : 'desativado'} com sucesso`, 'success');
    } catch (error) {
      showToast('Erro ao atualizar status', 'error');
    }
  };

  const handleSendInvite = async (student: Student) => {
    if (student.status !== 'invited') {
      showToast('Convite já foi aceito!', 'info');
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

      showToast(`Convite enviado para ${student.student_email}! 📧`, 'success');
    } catch (error) {
      showToast('Erro ao enviar convite', 'error');
    } finally {
      setSendingInvite(null);
    }
  };

  const handleSave = () => {
    setModalOpen(false);
    router.refresh();
  };

  const getStatusBadge = (status: string) => {
    const config = {
      invited: { class: 'badge-warning', label: 'Convidado', dot: true },
      active: { class: 'badge-success', label: 'Ativo', dot: true },
      inactive: { class: 'badge-gray', label: 'Inativo', dot: true },
    };

    const { class: className, label, dot } = config[status as keyof typeof config] || config.inactive;

    return (
      <span className={className}>
        {dot && <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />}
        {label}
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-dark-900">Meus Alunos</h1>
          <p className="text-dark-500 text-sm mt-1">
            {students.length} aluno{students.length !== 1 ? 's' : ''} cadastrado{students.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button onClick={handleCreate} className="btn-primary">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Novo Aluno
        </button>
      </div>

      {/* Filters */}
      <div className="card p-4 space-y-4">
        {/* Search */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <svg className="w-5 h-5 text-dark-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Buscar por nome ou email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-12"
          />
        </div>

        {/* Status Filter */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {[
            { key: 'all', label: 'Todos' },
            { key: 'active', label: 'Ativos' },
            { key: 'invited', label: 'Convidados' },
            { key: 'inactive', label: 'Inativos' },
          ].map((filter) => (
            <button
              key={filter.key}
              onClick={() => setStatusFilter(filter.key)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${
                statusFilter === filter.key
                  ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/25'
                  : 'bg-dark-100 text-dark-600 hover:bg-dark-200'
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
            icon="users"
            title="Nenhum aluno cadastrado"
            description="Comece adicionando seus alunos. Você poderá criar treinos personalizados para cada um."
            action={{
              label: 'Adicionar Primeiro Aluno',
              onClick: handleCreate,
            }}
          />
        ) : (
          <EmptyState
            icon="search"
            title="Nenhum aluno encontrado"
            description="Tente ajustar os filtros ou termo de busca."
          />
        )
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredStudents.map((student) => (
            <div
              key={student.id}
              className="card overflow-hidden group hover:shadow-elevated transition-all duration-300"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-primary-500 to-primary-600 p-5">
                <div className="flex items-start gap-3">
                  <div className="avatar avatar-lg text-base">
                    {student.student_name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-white text-lg truncate">{student.student_name}</h3>
                    <p className="text-sm text-white/80 truncate mt-0.5">{student.student_email}</p>
                  </div>
                </div>
                <div className="mt-3">
                  {getStatusBadge(student.status)}
                </div>
              </div>

              {/* Body */}
              <div className="p-5 space-y-4">
                {/* Quick Links */}
                <div className="grid grid-cols-3 gap-2">
                  <Link
                    href={`/app/personal/students/${student.id}/templates`}
                    className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-success-50 hover:bg-success-100 text-success-700 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                    </svg>
                    <span className="text-2xs font-semibold">Templates</span>
                  </Link>
                  <Link
                    href={`/app/personal/students/${student.id}/history`}
                    className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-primary-50 hover:bg-primary-100 text-primary-700 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                    </svg>
                    <span className="text-2xs font-semibold">Histórico</span>
                  </Link>
                  <GenerateReportButton 
                    studentId={student.id}
                    studentName={student.student_name}
                    variant="compact"
                  />
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(student)}
                    className="btn-secondary flex-1 py-2 text-sm"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                    </svg>
                    Editar
                  </button>
                  <button
                    onClick={() => handleToggleStatus(student)}
                    disabled={student.status === 'invited'}
                    className="btn-ghost flex-1 py-2 text-sm disabled:opacity-50"
                  >
                    {student.status === 'active' ? 'Desativar' : 'Ativar'}
                  </button>
                  <button
                    onClick={() => handleDeleteClick(student)}
                    className="btn-ghost p-2 text-danger-600 hover:bg-danger-50"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                    </svg>
                  </button>
                </div>

                {/* Invite Button */}
                {student.status === 'invited' && (
                  <button
                    onClick={() => handleSendInvite(student)}
                    disabled={sendingInvite === student.id}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-warning-50 hover:bg-warning-100 text-warning-700 font-semibold text-sm transition-colors disabled:opacity-50"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
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
