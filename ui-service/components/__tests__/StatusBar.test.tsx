// AI Assistance Disclosure:
// Tool: sst/opencode (model: Polaris Alpha), date: 2025‑11-11
// Scope: Generated implementation based on test specifications
// Author review: Validated correctness, fixed bugs

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StatusBar } from '../StatusBar';

describe('StatusBar component', () => {
  const defaultProps = {
    questionName: 'Two Sum',
    programmingLanguage: 'Python',
    difficulty: 'Easy',
    onEndSession: vi.fn(),
  };

  it('renders question name', () => {
    render(<StatusBar {...defaultProps} />);
    expect(screen.getByText(/Two Sum/)).toBeInTheDocument();
  });

  it('renders programming language', () => {
    render(<StatusBar {...defaultProps} />);
    expect(screen.getByText(/Python/)).toBeInTheDocument();
  });

  it('renders difficulty', () => {
    render(<StatusBar {...defaultProps} />);
    expect(screen.getByText(/Easy/)).toBeInTheDocument();
  });

  it('renders all session info together', () => {
    render(<StatusBar {...defaultProps} />);
    const sessionInfo = screen.getByText('Two Sum | Python | Easy');
    expect(sessionInfo).toBeInTheDocument();
  });

  it('renders end session button', () => {
    render(<StatusBar {...defaultProps} />);
    const button = screen.getByRole('button', { name: /end session/i });
    expect(button).toBeInTheDocument();
  });

  it('calls onEndSession when button is clicked', async () => {
    const user = userEvent.setup();
    const onEndSession = vi.fn();
    
    render(<StatusBar {...defaultProps} onEndSession={onEndSession} />);
    
    const button = screen.getByRole('button', { name: /end session/i });
    await user.click(button);
    
    expect(onEndSession).toHaveBeenCalledTimes(1);
  });

  it('end session button has destructive variant', () => {
    render(<StatusBar {...defaultProps} />);
    const button = screen.getByRole('button', { name: /end session/i });
    expect(button).toHaveClass('bg-destructive');
  });

  it('end session button has small size', () => {
    render(<StatusBar {...defaultProps} />);
    const button = screen.getByRole('button', { name: /end session/i });
    expect(button).toHaveClass('h-8');
  });

  it('renders with different question names', () => {
    render(<StatusBar {...defaultProps} questionName="Valid Parentheses" />);
    expect(screen.getByText(/Valid Parentheses/)).toBeInTheDocument();
  });

  it('renders with different programming languages', () => {
    render(<StatusBar {...defaultProps} programmingLanguage="JavaScript" />);
    expect(screen.getByText(/JavaScript/)).toBeInTheDocument();
  });

  it('renders with different difficulty levels', () => {
    render(<StatusBar {...defaultProps} difficulty="Hard" />);
    expect(screen.getByText(/Hard/)).toBeInTheDocument();
  });

  it('handles multiple clicks on end session button', async () => {
    const user = userEvent.setup();
    const onEndSession = vi.fn();
    
    render(<StatusBar {...defaultProps} onEndSession={onEndSession} />);
    
    const button = screen.getByRole('button', { name: /end session/i });
    await user.click(button);
    await user.click(button);
    await user.click(button);
    
    expect(onEndSession).toHaveBeenCalledTimes(3);
  });
});
