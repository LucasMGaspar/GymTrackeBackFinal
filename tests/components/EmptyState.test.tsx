import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { EmptyState } from '@/components/EmptyState';

describe('EmptyState', () => {
  it('renders title correctly', () => {
    render(
      <EmptyState 
        title="No items found" 
        description="Start by adding items" 
      />
    );
    expect(screen.getByText('No items found')).toBeInTheDocument();
  });

  it('renders description correctly', () => {
    render(
      <EmptyState 
        title="Title" 
        description="This is the description" 
      />
    );
    expect(screen.getByText('This is the description')).toBeInTheDocument();
  });

  it('renders action button when provided', () => {
    const handleClick = vi.fn();
    render(
      <EmptyState 
        title="Title" 
        description="Description"
        action={{
          label: 'Add Item',
          onClick: handleClick,
        }}
      />
    );
    
    const button = screen.getByRole('button', { name: 'Add Item' });
    expect(button).toBeInTheDocument();
    
    fireEvent.click(button);
    expect(handleClick).toHaveBeenCalled();
  });

  it('does not render action button when not provided', () => {
    render(
      <EmptyState 
        title="Title" 
        description="Description" 
      />
    );
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
