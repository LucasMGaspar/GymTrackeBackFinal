import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BottomNav } from '@/components/BottomNav';

describe('BottomNav', () => {
  it('renders student navigation items', () => {
    render(<BottomNav role="student" />);
    
    expect(screen.getByText('Hoje')).toBeInTheDocument();
    expect(screen.getByText('Histórico')).toBeInTheDocument();
    expect(screen.getByText('Perfil')).toBeInTheDocument();
  });

  it('renders personal navigation items', () => {
    render(<BottomNav role="personal" />);
    
    expect(screen.getByText('Início')).toBeInTheDocument();
    expect(screen.getByText('Alunos')).toBeInTheDocument();
    expect(screen.getByText('Exercícios')).toBeInTheDocument();
    expect(screen.getByText('Config')).toBeInTheDocument();
  });

  it('renders correct links for student role', () => {
    render(<BottomNav role="student" />);
    
    const links = screen.getAllByRole('link');
    expect(links).toHaveLength(3);
    expect(links[0]).toHaveAttribute('href', '/app/student/today');
    expect(links[1]).toHaveAttribute('href', '/app/student/history');
    expect(links[2]).toHaveAttribute('href', '/app/student/profile');
  });

  it('renders correct links for personal role', () => {
    render(<BottomNav role="personal" />);
    
    const links = screen.getAllByRole('link');
    expect(links).toHaveLength(4);
    expect(links[0]).toHaveAttribute('href', '/app/personal');
    expect(links[1]).toHaveAttribute('href', '/app/personal/students');
    expect(links[2]).toHaveAttribute('href', '/app/personal/exercises');
    expect(links[3]).toHaveAttribute('href', '/app/personal/settings');
  });
});
