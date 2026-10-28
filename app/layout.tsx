import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title: 'NEXUS | AI Virtual Society', description: 'A small experimental society powered by Gemini agents.' };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body>{children}</body></html>; }
