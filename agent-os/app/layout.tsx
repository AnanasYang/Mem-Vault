import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: {
    default: 'Agent Memory OS',
    template: '%s - Agent Memory OS',
  },
  description: '5层记忆系统管理界面 - L0实时层、L1情景记忆、L2程序记忆、L3语义记忆、L4核心记忆',
  keywords: ['AI', 'Memory', 'Agent', 'Memory System', '记忆系统'],
  authors: [{ name: 'Agent Memory OS' }],
  openGraph: {
    title: 'Agent Memory OS',
    description: '5层记忆系统管理界面',
    type: 'website',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#3b82f6',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN" className={inter.variable}>
      <body className={`${inter.className} antialiased`}>
        {children}
      </body>
    </html>
  );
}