"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

// Email whitelist - hanya email ini yang bisa login sebagai admin.
// Dibaca dari environment variable NEXT_PUBLIC_ADMIN_EMAILS (comma-separated list).
const ADMIN_EMAILS = process.env.NEXT_PUBLIC_ADMIN_EMAILS
  ? process.env.NEXT_PUBLIC_ADMIN_EMAILS.split(",").map(email => email.trim().toLowerCase())
  : [];

// Demo mode — bypass auth, masuk sebagai read-only viewer
const IS_DEMO = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Demo mode: skip Supabase auth, langsung masuk sebagai demo viewer
    if (IS_DEMO) {
      setIsLoading(false);
      return;
    }

    const checkSession = async () => {
      setIsLoading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          if (ADMIN_EMAILS.includes((session.user.email || "").toLowerCase())) {
            setUser(session.user);
          } else {
            await supabase.auth.signOut();
            setError("Email tidak memiliki akses admin");
          }
        }
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        if (ADMIN_EMAILS.includes((session.user.email || "").toLowerCase())) {
          setUser(session.user);
          setError(null);
        } else {
          supabase.auth.signOut();
          setError("Email tidak memiliki akses admin");
        }
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    try {
      setError(null);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/so`,
        },
      });
      if (error) throw error;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Gagal login dengan Google";
      setError(message);
    }
  };

  const signOut = async () => {
    try {
      if (!IS_DEMO) {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
      }
      setUser(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Gagal logout";
      setError(message);
    }
  };

  return {
    user,
    isLoading,
    error,
    isDemo: IS_DEMO,
    // Demo mode: always authenticated as read-only viewer
    isAuthenticated: IS_DEMO ? true : !!user,
    signInWithGoogle,
    signOut,
  };
};