import { Footer } from '@/components/footer';
import { Header } from '@/components/header/header';
import type { Metadata } from 'next';
import { Figtree } from 'next/font/google';
import './globals.css';
import { QueryProvider } from './providers/query-provider';

const figtree = Figtree({ subsets: ['latin'], variable: '--font-sans' });

export const metadata: Metadata = {
  title: 'Source - Discover and Share LLM Resources',
  description:
    'Your platform for searching, discovering, and sharing the best LLM prompts, tools, and agents.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={figtree.variable}>
      <body className={`antialiased`}>
        <QueryProvider>
          <Header />
          {children}
          <Footer />
        </QueryProvider>
      </body>
    </html>
  );
}
