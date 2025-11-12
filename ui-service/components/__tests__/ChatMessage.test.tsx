import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ChatMessage } from '../ChatMessage';

describe('ChatMessage component', () => {
  const defaultProps = {
    id: '1',
    userId: 'user-123',
    username: 'testuser',
    content: 'Hello, world!',
    timestamp: new Date('2024-01-01T12:00:00'),
  };

  it('renders message content', () => {
    render(<ChatMessage {...defaultProps} />);
    expect(screen.getByText('Hello, world!')).toBeInTheDocument();
  });

  it('renders username', () => {
    render(<ChatMessage {...defaultProps} />);
    expect(screen.getByText('testuser')).toBeInTheDocument();
  });

  it('renders formatted timestamp', () => {
    render(<ChatMessage {...defaultProps} />);
    expect(screen.getByText('12:00')).toBeInTheDocument();
  });

  it('displays "You" for current user messages', () => {
    render(<ChatMessage {...defaultProps} isCurrentUser={true} />);
    expect(screen.getByText('You')).toBeInTheDocument();
    expect(screen.queryByText('testuser')).not.toBeInTheDocument();
  });

  it('displays username for other user messages', () => {
    render(<ChatMessage {...defaultProps} isCurrentUser={false} />);
    expect(screen.getByText('testuser')).toBeInTheDocument();
    expect(screen.queryByText('You')).not.toBeInTheDocument();
  });

  it('shows "Sending..." when message is being sent', () => {
    render(<ChatMessage {...defaultProps} isSending={true} />);
    expect(screen.getByText('Sending...')).toBeInTheDocument();
  });

  it('applies correct styles for current user', () => {
    const { container } = render(<ChatMessage {...defaultProps} isCurrentUser={true} />);
    
    const messageContent = container.querySelector('.bg-primary');
    expect(messageContent).toBeInTheDocument();
  });

  it('applies correct styles for other users', () => {
    const { container } = render(<ChatMessage {...defaultProps} isCurrentUser={false} />);
    
    const messageContent = container.querySelector('.bg-muted');
    expect(messageContent).toBeInTheDocument();
  });

  it('renders avatar with first letter of username', () => {
    render(<ChatMessage {...defaultProps} username="Alice" />);
    expect(screen.getByText('A')).toBeInTheDocument();
  });

  it('renders avatar with uppercase first letter', () => {
    render(<ChatMessage {...defaultProps} username="bob" />);
    expect(screen.getByText('B')).toBeInTheDocument();
  });

  it('applies opacity when message is sending', () => {
    const { container } = render(<ChatMessage {...defaultProps} isSending={true} />);
    
    const messageContent = container.querySelector('.opacity-60');
    expect(messageContent).toBeInTheDocument();
  });

  it('formats single-digit hours with leading zero', () => {
    const timestamp = new Date('2024-01-01T09:05:00');
    render(<ChatMessage {...defaultProps} timestamp={timestamp} />);
    expect(screen.getByText('09:05')).toBeInTheDocument();
  });

  it('formats single-digit minutes with leading zero', () => {
    const timestamp = new Date('2024-01-01T12:05:00');
    render(<ChatMessage {...defaultProps} timestamp={timestamp} />);
    expect(screen.getByText('12:05')).toBeInTheDocument();
  });

  it('handles different message content', () => {
    render(<ChatMessage {...defaultProps} content="**Bold text** and *italic*" />);
    expect(screen.getByText('Bold text')).toBeInTheDocument();
  });

  it('handles long usernames', () => {
    render(<ChatMessage {...defaultProps} username="verylongusername123" />);
    expect(screen.getByText('verylongusername123')).toBeInTheDocument();
  });

  it('handles messages with markdown formatting', () => {
    render(<ChatMessage {...defaultProps} content="`code block`" />);
    const codeElement = screen.getByText('code block');
    expect(codeElement).toBeInTheDocument();
  });

  it('renders with unique message id', () => {
    const { rerender } = render(<ChatMessage {...defaultProps} id="msg-1" />);
    expect(screen.getByText('Hello, world!')).toBeInTheDocument();
    
    rerender(<ChatMessage {...defaultProps} id="msg-2" />);
    expect(screen.getByText('Hello, world!')).toBeInTheDocument();
  });

  it('handles empty content gracefully', () => {
    render(<ChatMessage {...defaultProps} content="" />);
    const { container } = render(<ChatMessage {...defaultProps} content="" />);
    expect(container).toBeInTheDocument();
  });

  it('applies correct layout for current user (right-aligned)', () => {
    const { container } = render(<ChatMessage {...defaultProps} isCurrentUser={true} />);
    
    const messageWrapper = container.querySelector('.justify-end');
    expect(messageWrapper).toBeInTheDocument();
  });

  it('applies correct layout for other users (left-aligned)', () => {
    const { container } = render(<ChatMessage {...defaultProps} isCurrentUser={false} />);
    
    const messageWrapper = container.querySelector('.justify-end');
    expect(messageWrapper).not.toBeInTheDocument();
  });

  it('renders spinner when message is sending', () => {
    render(<ChatMessage {...defaultProps} isCurrentUser={true} isSending={true} />);
    
    // Spinner component should be present with role="status" (only for current user)
    const spinner = screen.getByRole('status');
    expect(spinner).toBeInTheDocument();
    expect(spinner).toHaveAttribute('aria-label', 'Loading');
  });
});
