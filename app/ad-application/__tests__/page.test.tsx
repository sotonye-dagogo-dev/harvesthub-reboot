import { describe, expect, it, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import AdApplicationPage from '@/app/ad-application/page';

vi.mock('@/components/ui/ImageUpload', () => ({
  default: ({ folderType, onUploaded }: { folderType: string; onUploaded?: (result: { url: string; publicId: string }) => void }) => (
    <button
      type="button"
      aria-label={`mock-upload-${folderType}`}
      onClick={() =>
        onUploaded?.({
          url:
            folderType === 'payment-proof'
              ? 'https://res.cloudinary.com/demo/image/upload/payment-proof.jpg'
              : 'https://res.cloudinary.com/demo/image/upload/banner.jpg',
          publicId: `${folderType}-public-id`,
        })
      }
    >
      Upload mock {folderType}
    </button>
  ),
}));

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
    fireEvent.click(screen.getByLabelText('mock-upload-ad'));
    fireEvent.change(screen.getByLabelText('Amount Paid'), { target: { value: '1200' } });
    fireEvent.click(screen.getByLabelText('mock-upload-payment-proof'));

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
