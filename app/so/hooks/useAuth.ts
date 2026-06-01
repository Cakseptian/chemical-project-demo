"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

// Email whitelist - hanya email ini yang bisa login sebagai admin
const ADMIN_EMAILS = [
  "septianhkc@gmail.com"
];

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check session on mount
  useEffect(() => {
    const checkSession = async () => {
      setIsLoading(true);
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user) {
        // Validate email whitelist
        if (ADMIN_EMAILS.includes(session.user.email || "")) {
          setUser(session.user);
        } else {
          // Email tidak di whitelist, sign out
          await supabase.auth.signOut();
          setError("Email tidak memiliki akses admin");
        }
      }

      setIsLoading(false);
    };

    checkSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        if (ADMIN_EMAILS.includes(session.user.email || "")) {
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

  // Login dengan Google OAuth
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
    } catch (err: any) {
      setError(err.message || "Gagal login dengan Google");
    }
  };

  // Logout
  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null);
    } catch (err: any) {
      setError(err.message || "Gagal logout");
    }
  };

  return {
    user,
    isLoading,
    error,
    isAuthenticated: !!user,
    signInWithGoogle,
    signOut,
  };
};