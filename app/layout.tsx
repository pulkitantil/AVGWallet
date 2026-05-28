import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'AVG Wallet',
  description:
    'Multi-chain cryptocurrency wallet supporting Ethereum, Polygon, Binance, Base, Solana, and Bitcoin',

  icons: {
    icon: '/logo.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <div className="mobile-container">
          {children}
        </div>
      </body>
    </html>
  );
}