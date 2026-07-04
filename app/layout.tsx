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
          <main className="flex-1">
            {children}
          </main>
        </LenisProvider>

        {/* <footer className="w-full bg-slate-900 border-t border-slate-700 text-slate-300 text-[10px] text-center py-4 shrink-0 flex flex-wrap justify-center items-center gap-2 md:gap-3">
          <span className="font-mono">System Engineered & Developed by <strong className="text-white"><a href="https://www.linkedin.com/in/septianrizqi/" target="_blank" rel="noopener noreferrer">Septian Rizqi Arifandi</a></strong></span>
          <span className="hidden md:inline opacity-40">|</span>
          <span className="font-mono">GMF AeroAsia © {new Date().getFullYear()}</span>
        </footer> */}

      </body>
    </html>
  );
}
