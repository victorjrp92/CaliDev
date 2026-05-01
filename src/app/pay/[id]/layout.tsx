import '@/app/globals.css';
import { Inter } from 'next/font/google';
import { ThemeProvider } from '@/components/theme-provider';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });

export default function PayLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable}`}>
      <body className="font-sans">
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
