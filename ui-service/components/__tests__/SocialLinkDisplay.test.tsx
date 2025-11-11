import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SocialLinkDisplay } from '../SocialLinkDisplay';
import { SocialLink } from '@/types/social';

describe('SocialLinkDisplay component', () => {
  it('renders nothing when links array is empty', () => {
    const { container } = render(<SocialLinkDisplay links={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders a single social link', () => {
    const links: SocialLink[] = [
      {
        id: '1',
        platform: 'github',
        url: 'https://github.com/testuser',
      },
    ];

    render(<SocialLinkDisplay links={links} />);
    const link = screen.getByRole('link', { name: /github/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', 'https://github.com/testuser');
  });

  it('renders multiple social links', () => {
    const links: SocialLink[] = [
      {
        id: '1',
        platform: 'github',
        url: 'https://github.com/testuser',
      },
      {
        id: '2',
        platform: 'linkedin',
        url: 'https://linkedin.com/in/testuser',
      },
      {
        id: '3',
        platform: 'twitter',
        url: 'https://twitter.com/testuser',
      },
    ];

    render(<SocialLinkDisplay links={links} />);
    
    expect(screen.getByRole('link', { name: /github/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /linkedin/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /twitter/i })).toBeInTheDocument();
  });

  it('opens links in new tab with security attributes', () => {
    const links: SocialLink[] = [
      {
        id: '1',
        platform: 'github',
        url: 'https://github.com/testuser',
      },
    ];

    render(<SocialLinkDisplay links={links} />);
    const link = screen.getByRole('link');
    
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('renders correct URLs for each link', () => {
    const links: SocialLink[] = [
      {
        id: '1',
        platform: 'github',
        url: 'https://github.com/user1',
      },
      {
        id: '2',
        platform: 'linkedin',
        url: 'https://linkedin.com/in/user2',
      },
    ];

    render(<SocialLinkDisplay links={links} />);
    
    const githubLink = screen.getByRole('link', { name: /github/i });
    const linkedinLink = screen.getByRole('link', { name: /linkedin/i });
    
    expect(githubLink).toHaveAttribute('href', 'https://github.com/user1');
    expect(linkedinLink).toHaveAttribute('href', 'https://linkedin.com/in/user2');
  });

  it('renders with undefined platform', () => {
    const links: SocialLink[] = [
      {
        id: '1',
        platform: undefined,
        url: 'https://example.com',
      },
    ];

    render(<SocialLinkDisplay links={links} />);
    // Should render with default "Link" label when platform is undefined
    const link = screen.getByRole('link', { name: /link/i });
    expect(link).toBeInTheDocument();
  });

  it('renders all supported platforms correctly', () => {
    const platforms: Array<SocialLink['platform']> = [
      'github',
      'linkedin',
      'twitter',
      'instagram',
      'facebook',
      'youtube',
    ];

    const links: SocialLink[] = platforms.map((platform, index) => ({
      id: `${index}`,
      platform,
      url: `https://example.com/${platform}`,
    }));

    render(<SocialLinkDisplay links={links} />);
    
    // Check that all links are rendered
    expect(screen.getAllByRole('link')).toHaveLength(6);
  });

  it('applies correct button styling classes', () => {
    const links: SocialLink[] = [
      {
        id: '1',
        platform: 'github',
        url: 'https://github.com/testuser',
      },
    ];

    render(<SocialLinkDisplay links={links} />);
    const link = screen.getByRole('link');
    
    // The button should have outline variant and small size
    expect(link).toHaveClass('gap-2');
  });

  it('renders with web platform', () => {
    const links: SocialLink[] = [
      {
        id: '1',
        platform: 'web',
        url: 'https://mywebsite.com',
      },
    ];

    render(<SocialLinkDisplay links={links} />);
    const link = screen.getByRole('link', { name: /web/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', 'https://mywebsite.com');
  });
});
