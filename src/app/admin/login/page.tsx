"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"password" | "magic_link">("password");
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "error" | "success";
    text: string;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setFeedback(null);

    try {
      if (mode === "magic_link") {
        const supabase = createSupabaseBrowserClient();
        if (!supabase) {
          setFeedback({
            type: "error",
            text: "Supabase URL and Anon Key must be configured in environment variables to send Magic Links."
          });
          setLoading(false);
          return;
        }
        const { error } = await supabase.auth.signInWithOtp({
          email: email.trim().toLowerCase(),
          options: {
            emailRedirectTo: `${window.location.origin}/admin`
          }
        });
        if (error) {
          setFeedback({ type: "error", text: error.message });
        } else {
          setFeedback({
            type: "success",
            text: "Magic link dispatched. Check your inbox to continue to the Maison Portal."
          });
        }
        setLoading(false);
        return;
      }

      const res = await fetch("/api/admin/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, action: "login" })
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };

      if (!res.ok || !data.ok) {
        setFeedback({
          type: "error",
          text:
            data.error ||
            "Access denied. Verify your admin credentials and authorisation in the admins table."
        });
        setLoading(false);
        return;
      }

      router.push("/admin");
      router.refresh();
    } catch {
      setFeedback({
        type: "error",
        text: "Unable to reach authentication endpoint."
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[78vh] items-center justify-center bg-obsidian px-4 py-16">
      <div className="w-full max-w-md rounded-2xl border border-gold/35 bg-surface p-8 shadow-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">
          Authorised Access Only
        </p>
        <h1 className="mt-2 font-serif text-3xl text-cream">
          STEPUP STORIES Admin
        </h1>
        <p className="mt-2 text-xs leading-relaxed text-cream-secondary">
          Sign in with an account listed in the <code className="text-gold-bright">public.admins</code> table. Being authenticated alone does not grant access.
        </p>

        <div className="mt-6 flex gap-2">
          <button
            type="button"
            onClick={() => setMode("password")}
            className={`flex-1 rounded border py-2 text-xs font-semibold uppercase tracking-wider ${
              mode === "password"
                ? "border-gold bg-gold text-obsidian"
                : "border-gold/25 bg-obsidian text-cream-secondary"
            }`}
          >
            Email + Password
          </button>
          <button
            type="button"
            onClick={() => setMode("magic_link")}
            className={`flex-1 rounded border py-2 text-xs font-semibold uppercase tracking-wider ${
              mode === "magic_link"
                ? "border-gold bg-gold text-obsidian"
                : "border-gold/25 bg-obsidian text-cream-secondary"
            }`}
          >
            Magic Link
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label
              htmlFor="admin-email"
              className="block text-xs font-semibold uppercase tracking-[0.14em] text-gold"
            >
              Admin Email
            </label>
            <input
              id="admin-email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1.5 w-full rounded border border-gold/30 bg-obsidian px-4 py-2.5 text-sm text-cream focus:border-gold-bright"
            />
          </div>

          {mode === "password" && (
            <div>
              <label
                htmlFor="admin-password"
                className="block text-xs font-semibold uppercase tracking-[0.14em] text-gold"
              >
                Password
              </label>
              <input
                id="admin-password"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1.5 w-full rounded border border-gold/30 bg-obsidian px-4 py-2.5 text-sm text-cream focus:border-gold-bright"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded bg-gradient-to-r from-gold-bright to-gold py-3 text-xs font-semibold uppercase tracking-[0.16em] text-obsidian transition hover:brightness-110 disabled:opacity-60"
          >
            {loading
              ? "Verifying..."
              : mode === "magic_link"
                ? "Send Magic Link"
                : "Sign In to Admin Portal"}
          </button>
        </form>

        <div aria-live="polite" className="mt-4">
          {feedback && (
            <p
              role="status"
              className={`rounded border p-3 text-xs ${
                feedback.type === "success"
                  ? "border-gold bg-gold/10 text-gold-bright"
                  : "border-burgundy-bright bg-burgundy/25 text-cream"
              }`}
            >
              {feedback.text}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
