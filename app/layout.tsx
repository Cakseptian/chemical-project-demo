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
          {/* Demo Banner — ZZZ police line style */}
          <div className="w-full relative overflow-hidden shrink-0" style={{height: '34px'}}>
            {/* Animated diagonal stripes background */}
            <div
              className="absolute inset-0"
              style={{
                background: 'repeating-linear-gradient(110deg, #000 0px, #000 24px, #facc15 24px, #facc15 48px)',
                backgroundSize: '68px 100%',
                animation: 'police-slide 2.8s linear infinite',
              }}
            />
            {/* Overlay to tone down the yellow */}
            <div className="absolute inset-0 bg-black/50" />
            {/* Content */}
            <div className="relative z-10 h-full flex items-center justify-center gap-3 px-4">
              <span
                style={{
                  fontFamily: "'Bebas Neue', 'Anton', 'Impact', 'Arial Narrow', sans-serif",
                  fontSize: '13px',
                  letterSpacing: '0.22em',
                  color: '#ffffff',
                  textShadow: '0 0 8px rgba(0,0,0,0.9), 0 0 3px rgba(0,0,0,0.7)',
                  fontWeight: 900,
                  textTransform: 'uppercase',
                }}
              >
                ⚠ PORTFOLIO DEMO — Data resets periodically. Feel free to explore.
              </span>
              <a
                href="https://github.com/septianshft/Stock-Opname-Project"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  fontFamily: "'Bebas Neue', 'Anton', 'Impact', 'Arial Narrow', sans-serif",
                  fontSize: '12px',
                  letterSpacing: '0.18em',
                  color: '#facc15',
                  textShadow: '0 0 8px rgba(0,0,0,0.9), 0 0 3px rgba(0,0,0,0.7)',
                  fontWeight: 900,
                  textTransform: 'uppercase',
                  textDecoration: 'underline',
                  textUnderlineOffset: '3px',
                  flexShrink: 0,
                }}
              >
                Source →
              </a>
            </div>
          </div>
          <style>{`
            @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap');
            @keyframes police-slide {
              0%   { background-position: 0 0; }
              100% { background-position: 68px 0; }
            }
          `}</style>

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
