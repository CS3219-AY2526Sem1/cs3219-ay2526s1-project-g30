import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MarkdownRenderer } from '../MarkdownRenderer';

describe('MarkdownRenderer component', () => {
  it('renders plain text correctly', () => {
    render(<MarkdownRenderer content="Hello, world!" />);
    expect(screen.getByText('Hello, world!')).toBeInTheDocument();
  });

  it('renders bold text', () => {
    render(<MarkdownRenderer content="**bold text**" />);
    const boldElement = screen.getByText('bold text');
    expect(boldElement.tagName).toBe('STRONG');
  });

  it('renders italic text', () => {
    render(<MarkdownRenderer content="*italic text*" />);
    const italicElement = screen.getByText('italic text');
    expect(italicElement.tagName).toBe('EM');
  });

  it('renders headings', () => {
    render(<MarkdownRenderer content="# Heading 1" />);
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toBeInTheDocument();
    expect(heading).toHaveTextContent('Heading 1');
  });

  it('renders multiple heading levels', () => {
    const content = '# H1\n## H2\n### H3';
    render(<MarkdownRenderer content={content} />);
    
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('H1');
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('H2');
    expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('H3');
  });

  it('renders links with correct attributes', () => {
    render(<MarkdownRenderer content="[GitHub](https://github.com)" />);
    const link = screen.getByRole('link', { name: 'GitHub' });
    
    expect(link).toHaveAttribute('href', 'https://github.com');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('renders unordered lists', () => {
    const content = '- Item 1\n- Item 2\n- Item 3';
    render(<MarkdownRenderer content={content} />);
    
    const list = screen.getByRole('list');
    expect(list.tagName).toBe('UL');
    expect(screen.getByText('Item 1')).toBeInTheDocument();
    expect(screen.getByText('Item 2')).toBeInTheDocument();
    expect(screen.getByText('Item 3')).toBeInTheDocument();
  });

  it('renders ordered lists', () => {
    const content = '1. First\n2. Second\n3. Third';
    render(<MarkdownRenderer content={content} />);
    
    const list = screen.getByRole('list');
    expect(list.tagName).toBe('OL');
  });

  it('renders inline code', () => {
    render(<MarkdownRenderer content="Use `console.log()` for debugging" />);
    const codeElement = screen.getByText('console.log()');
    expect(codeElement.tagName).toBe('CODE');
  });

  it('renders code blocks', () => {
    const content = '```\nconst x = 5;\nconsole.log(x);\n```';
    render(<MarkdownRenderer content={content} />);
    
    const codeBlock = screen.getByText(/const x = 5/);
    expect(codeBlock).toBeInTheDocument();
  });

  it('renders blockquotes', () => {
    render(<MarkdownRenderer content="> This is a quote" />);
    const quote = screen.getByText('This is a quote');
    expect(quote.closest('blockquote')).toBeInTheDocument();
  });

  it('renders horizontal rules', () => {
    const { container } = render(<MarkdownRenderer content="---" />);
    const hr = container.querySelector('hr');
    expect(hr).toBeInTheDocument();
  });

  it('applies custom text size', () => {
    const { container } = render(
      <MarkdownRenderer content="Text with custom size" textSize={18} />
    );
    
    const paragraph = container.querySelector('p');
    expect(paragraph).toHaveStyle({ fontSize: '18px' });
  });

  it('uses default text size of 14px', () => {
    const { container } = render(<MarkdownRenderer content="Default size text" />);
    
    const paragraph = container.querySelector('p');
    expect(paragraph).toHaveStyle({ fontSize: '14px' });
  });

  it('renders with custom className', () => {
    const { container } = render(
      <MarkdownRenderer content="Test" className="custom-class" />
    );
    
    const markdownContainer = container.querySelector('.markdown-content');
    expect(markdownContainer).toHaveClass('custom-class');
  });

  it('renders in compact mode', () => {
    const { container } = render(
      <MarkdownRenderer content="Compact text" isCompact={true} />
    );
    
    expect(container.querySelector('.markdown-content')).toBeInTheDocument();
  });

  it('renders with dark mode', () => {
    const { container } = render(
      <MarkdownRenderer content="`code`" isDark={true} />
    );
    
    const codeElement = container.querySelector('code');
    expect(codeElement).toBeInTheDocument();
  });

  it('renders tables with GitHub-flavored markdown', () => {
    const content = `
| Header 1 | Header 2 |
|----------|----------|
| Cell 1   | Cell 2   |
`;
    render(<MarkdownRenderer content={content} />);
    
    const table = screen.getByRole('table');
    expect(table).toBeInTheDocument();
  });

  it('renders strikethrough text', () => {
    render(<MarkdownRenderer content="~~strikethrough~~" />);
    const strikethrough = screen.getByText('strikethrough');
    expect(strikethrough.tagName).toBe('DEL');
  });
});
