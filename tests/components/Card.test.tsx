import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Card, CardHeader } from '@/components/Card';

describe('Card', () => {
  it('renders children correctly', () => {
    render(<Card>Card content</Card>);
    expect(screen.getByText('Card content')).toBeInTheDocument();
  });

  it('applies default variant styles', () => {
    render(<Card data-testid="card">Content</Card>);
    expect(screen.getByTestId('card')).toHaveClass('bg-white', 'rounded-2xl', 'shadow-soft');
  });

  it('applies interactive variant styles', () => {
    render(<Card variant="interactive" data-testid="card">Content</Card>);
    expect(screen.getByTestId('card')).toHaveClass('card-hover', 'cursor-pointer');
  });

  it('applies bordered variant styles', () => {
    render(<Card variant="bordered" data-testid="card">Content</Card>);
    expect(screen.getByTestId('card')).toHaveClass('border', 'border-gray-200');
  });

  it('applies padding classes correctly', () => {
    const { rerender } = render(<Card padding="none" data-testid="card">Content</Card>);
    expect(screen.getByTestId('card')).not.toHaveClass('p-4', 'p-6', 'p-8');

    rerender(<Card padding="sm" data-testid="card">Content</Card>);
    expect(screen.getByTestId('card')).toHaveClass('p-4');

    rerender(<Card padding="md" data-testid="card">Content</Card>);
    expect(screen.getByTestId('card')).toHaveClass('p-6');

    rerender(<Card padding="lg" data-testid="card">Content</Card>);
    expect(screen.getByTestId('card')).toHaveClass('p-8');
  });
});

describe('CardHeader', () => {
  it('renders title', () => {
    render(<CardHeader title="Test Title" />);
    expect(screen.getByText('Test Title')).toBeInTheDocument();
  });

  it('renders description when provided', () => {
    render(<CardHeader title="Title" description="Test description" />);
    expect(screen.getByText('Test description')).toBeInTheDocument();
  });

  it('renders action when provided', () => {
    render(
      <CardHeader 
        title="Title" 
        action={<button>Action</button>} 
      />
    );
    expect(screen.getByRole('button', { name: 'Action' })).toBeInTheDocument();
  });

  it('renders icon when provided', () => {
    const TestIcon = () => <span data-testid="test-icon">Icon</span>;
    render(<CardHeader title="Title" icon={<TestIcon />} />);
    expect(screen.getByTestId('test-icon')).toBeInTheDocument();
  });
});
