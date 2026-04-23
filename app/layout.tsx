// Root layout. Loads Tailwind globals + font stacks.
// Every route renders inside this shell.

import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'K&D Landscaping — Project Portal',
  description:
    "Tell us about your project and we'll match you with the right K&D team.",
  icons: { icon: '/favicon.ico' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-cream text-grounded-black antialiased">
        {children}
      </body>
    </html>
  );
}
