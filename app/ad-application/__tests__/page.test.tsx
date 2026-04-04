import { describe, expect, it, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import AdApplicationPage from '@/app/ad-application/page';

describe('AdApplicationPage', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('submits form payload to ads apply endpoint', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    });
    vi.stubGlobal('fetch', fetchMock as unknown as typeof fetch);

    render(<AdApplicationPage />);

    fireEvent.change(screen.getByLabelText('Full Name'), { target: { value: 'Jane Doe' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'jane@example.com' } });
    fireEvent.change(screen.getByLabelText('Phone Number'), { target: { value: '+2348012345678' } });
    fireEvent.change(screen.getByLabelText('Campaign Title'), { target: { value: 'Lagos Promo' } });
    fireEvent.change(screen.getByLabelText('Description'), { target: { value: 'Campaign description text' } });
    fireEvent.change(screen.getByLabelText('Banner Image URL'), {
      target: { value: 'https://example.com/banner.jpg' },
    });
    fireEvent.change(screen.getByLabelText('Amount Paid'), { target: { value: '1200' } });
    fireEvent.change(screen.getByLabelText('Proof of Transfer URL'), {
      target: { value: 'https://example.com/proof.jpg' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Submit Application' }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    const firstCall = fetchMock.mock.calls[0];
    expect(firstCall).toBeDefined();

    const [url, options] = firstCall as [string, RequestInit];
    expect(url).toBe('/api/ads/apply');
    expect(options.method).toBe('POST');
    expect(options.headers).toMatchObject({
      'Content-Type': 'application/json',
    });
    expect(options.body).toContain('Lagos Promo');
  });
});
