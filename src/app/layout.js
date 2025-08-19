'use client';

import { Geist, Geist_Mono } from "next/font/google";
import { usePathname } from 'next/navigation';
import { AuthProvider } from '@/components/AuthProvider';
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({ children }) {
  const pathname = usePathname();
  
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <LayoutContent pathname={pathname}>{children}</LayoutContent>
      </body>
    </html>
  );
}

function LayoutContent({ children, pathname }) {
  // Don't wrap auth pages with AuthProvider
  if (pathname && pathname.startsWith('/g/')) {
    return children;
  }
  
  // Wrap all other pages with AuthProvider for protection
  return (
    <AuthProvider>
      {children}
    </AuthProvider>
  );
}
