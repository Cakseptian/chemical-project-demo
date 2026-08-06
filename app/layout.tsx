import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { LenisProvider } from "./components/LenisProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "GMF Inventory System",
  description: "Self-Service Item Request & Inventory Control",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-slate-50 text-slate-900 antialiased">
        <LenisProvider>
          {/* Demo Banner */}
          <div className="w-full bg-amber-400 text-amber-900 text-xs font-semibold text-center py-1.5 px-4 flex items-center justify-center gap-2 shrink-0">
            <svg className="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span>
              🎯 Portfolio Demo — Data resets periodically. Feel free to explore all features.
            </span>
            <a
              href="https://github.com/septianshft/Stock-Opname-Project"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 hover:text-amber-700 transition-colors ml-1"
            >
              View Source →
            </a>
          </div>

          <main className="flex-1">
            {children}
          </main>
        </LenisProvider>

        <footer className="w-full bg-slate-900 border-t border-slate-700 text-slate-300 text-[10px] text-center py-3 shrink-0 flex flex-wrap justify-center items-center gap-2 md:gap-3">
          <span className="font-mono">Engineered & Developed by <strong className="text-white"><a href="https://www.linkedin.com/in/septianrizqi/" target="_blank" rel="noopener noreferrer" className="hover:text-emerald-400 transition-colors">Septian Rizqi Arifandi</a></strong></span>
          <span className="hidden md:inline opacity-40">|</span>
          <span className="font-mono opacity-60">GMF AeroAsia © {new Date().getFullYear()}</span>
        </footer>

      </body>
    </html>
  );
}
