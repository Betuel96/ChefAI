
import { ReactNode } from 'react';
import './globals.css'

export default function RootLayout({ children }: { children: ReactNode }) {
  // This root layout is minimal and passes children through.
  // The actual layout with language and providers is in /app/[locale]/layout.tsx
  return children;
}
