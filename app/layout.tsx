import React from 'react';
import { GuardAuthProvider } from '@/app/context/GuardAuthContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className={inter.className}>
        <GuardAuthProvider>
          {children}
          <ToastContainer />
        </GuardAuthProvider>
      </body>
    </html>
  );
}


