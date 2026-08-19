// app/so/components/LoginPage.tsx
"use client";

import { useState } from "react";

interface LoginPageProps {
    onSignIn: () => void;
    error: string | null;
}

const IconSpinner = () => (
    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
);

export function LoginPage({ onSignIn, error }: LoginPageProps) {
    const [isLoading, setIsLoading] = useState(false);

    const handleSignIn = async () => {
        setIsLoading(true);
        try {
            await onSignIn();
        } finally {
            setTimeout(() => setIsLoading(false), 3000);
        }
    };

    return (
        <div className="min-h-screen bg-[#020817] flex items-center justify-center p-4">
            <div className="w-full max-w-[360px] fade-up">

                {/* Heading */}
                <div className="mb-8 text-center">
                    <h1 className="text-white text-xl font-semibold tracking-tight mb-2">
                        Sign in to GMF Inventory
                    </h1>
                    <p className="text-white/40 text-sm">
                        Continue with your Google account.
                    </p>
                </div>

                {/* Error */}
                {error && (
                    <div
                        role="alert"
                        aria-live="polite"
                        className="mb-4 flex items-start gap-2.5 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-lg"
                    >
                        <svg className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        <p className="text-red-400 text-xs leading-snug">{error}</p>
                    </div>
                )}

                {/* Google button */}
                <button type="button"
                    onClick={handleSignIn}
                    disabled={isLoading}
                    aria-label="Sign in with Google"
                    className="w-full flex items-center justify-center gap-3 px-4 py-2.5 bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-900 text-sm font-medium rounded-lg border border-white/10 transition-colors duration-150 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 focus-visible:ring-offset-2 focus-visible:ring-offset-[#020817]"
                >
                    {isLoading ? (
                        <>
                            <IconSpinner />
                            <span>Signing in…</span>
                        </>
                    ) : (
                        <>
                            <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                            </svg>
                            <span>Continue with Google</span>
                        </>
                    )}
                </button>

                {/* Footer */}
                <div className="mt-8 flex items-center justify-between">
                    <a href="/" className="text-white/25 hover:text-white/50 text-xs transition-colors duration-150 cursor-pointer">
                        ← Back
                    </a>
                    <p className="text-white/20 text-xs">© 2026 GMF Inventory</p>
                </div>
            </div>
        </div>
    );
}
