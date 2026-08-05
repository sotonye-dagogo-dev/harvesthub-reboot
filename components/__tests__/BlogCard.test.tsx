import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BlogCard } from '@/components/features/blog/BlogCard';

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

describe('BlogCard', () => {
  it('renders post metadata and links to the article', () => {
    render(
      <BlogCard
        post={{
          slug: 'hello-world',
          title: 'Hello World',
          excerpt: 'A short summary.',
          coverImage: null,
          authorName: 'Jane Doe',
          category: 'News',
          publishedAt: '2026-08-01T00:00:00.000Z',
          body: '<p>Some body content</p>',
        }}
      />
    );

    const link = screen.getByRole('link', { name: /Hello World/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/blog/hello-world');

    expect(screen.getByText(/Jane Doe/i)).toBeInTheDocument();
    expect(screen.getByText(/News/i)).toBeInTheDocument();
  });
});
