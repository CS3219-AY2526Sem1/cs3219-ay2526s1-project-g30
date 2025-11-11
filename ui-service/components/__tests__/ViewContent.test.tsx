import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ViewContent } from '../ViewContent';

describe('ViewContent component', () => {
  it('renders children correctly', () => {
    render(
      <ViewContent viewId="test-view" isActive={true}>
        <div>Test content</div>
      </ViewContent>
    );
    
    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  it('applies correct className', () => {
    const { container } = render(
      <ViewContent viewId="test-view" isActive={true}>
        <div>Content</div>
      </ViewContent>
    );
    
    // Check if the motion.div has space-y-6 class
    const motionDiv = container.querySelector('.space-y-6');
    expect(motionDiv).toBeInTheDocument();
  });

  it('handles different viewIds', () => {
    const { rerender } = render(
      <ViewContent viewId="view-1" isActive={true}>
        <div>View 1</div>
      </ViewContent>
    );
    
    expect(screen.getByText('View 1')).toBeInTheDocument();
    
    rerender(
      <ViewContent viewId="view-2" isActive={true}>
        <div>View 2</div>
      </ViewContent>
    );
    
    expect(screen.getByText('View 2')).toBeInTheDocument();
  });

  it('renders with forward direction by default', () => {
    const { container } = render(
      <ViewContent viewId="test" isActive={true}>
        <div>Content</div>
      </ViewContent>
    );
    
    expect(container.firstChild).toBeInTheDocument();
  });

  it('renders with backward direction when specified', () => {
    const { container } = render(
      <ViewContent viewId="test" direction="backward" isActive={true}>
        <div>Content</div>
      </ViewContent>
    );
    
    expect(container.firstChild).toBeInTheDocument();
  });

  it('renders when inactive', () => {
    render(
      <ViewContent viewId="test" isActive={false}>
        <div>Inactive content</div>
      </ViewContent>
    );
    
    expect(screen.getByText('Inactive content')).toBeInTheDocument();
  });

  it('renders multiple children', () => {
    render(
      <ViewContent viewId="test" isActive={true}>
        <div>Child 1</div>
        <div>Child 2</div>
        <div>Child 3</div>
      </ViewContent>
    );
    
    expect(screen.getByText('Child 1')).toBeInTheDocument();
    expect(screen.getByText('Child 2')).toBeInTheDocument();
    expect(screen.getByText('Child 3')).toBeInTheDocument();
  });
});
