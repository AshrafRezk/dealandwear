import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '../auth/AuthContext';
import ConsentBanner from '../layout/ConsentBanner';
import { readConsent } from '../lib/consent';
import ProductCard from '../ui/ProductCard';
import { ToastProvider } from '../ui/Toast';

function wrap(ui) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <AuthProvider>
          <ToastProvider>{ui}</ToastProvider>
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

const product = {
  id: '01t000000000001AAA',
  name: 'Wool Wrap Coat',
  brandName: 'Studio Nour',
  price: 4280,
  compareAtPrice: 5000,
  discountPercent: 14,
  image: 'https://example.com/coat.jpg',
  images: ['https://example.com/coat.jpg'],
  fitMatch: 92,
  isSaved: false,
};

describe('ProductCard', () => {
  it('shows brand, price, discount and Fit Match', () => {
    wrap(<ProductCard product={product} />);
    expect(screen.getByRole('heading', { name: 'Wool Wrap Coat' })).toBeInTheDocument();
    expect(screen.getByText('Studio Nour')).toBeInTheDocument();
    expect(screen.getByText('92% Fit Match')).toBeInTheDocument();
    expect(screen.getByText('−14%')).toBeInTheDocument();
    expect(screen.getByRole('link')).toHaveAttribute('href', '/p/01t000000000001AAA');
  });

  it('asks guests to sign in before saving', async () => {
    wrap(<ProductCard product={product} />);
    await userEvent.click(screen.getByRole('button', { name: 'Save Wool Wrap Coat' }));
    expect(await screen.findByText(/Sign in to save/)).toBeInTheDocument();
  });
});

describe('ConsentBanner', () => {
  it('stores an essential-only choice and hides', async () => {
    wrap(<ConsentBanner />);
    await userEvent.click(screen.getByRole('button', { name: 'Essential only' }));
    expect(readConsent()).toMatchObject({ analytics: false });
    expect(screen.queryByRole('button', { name: 'Allow analytics' })).not.toBeInTheDocument();
  });

  it('stays hidden once a choice exists', () => {
    localStorage.setItem('fyf.consent', JSON.stringify({ analytics: true }));
    wrap(<ConsentBanner />);
    expect(screen.queryByRole('button', { name: 'Allow analytics' })).not.toBeInTheDocument();
  });
});
