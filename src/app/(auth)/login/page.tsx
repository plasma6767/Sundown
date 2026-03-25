"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  async function onSubmit(values: LoginFormValues) {
    setIsLoading(true);
    setFormError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: values.email,
      password: values.password,
    });
    if (error) {
      const msg =
        error.message.toLowerCase().includes("invalid login credentials")
          ? "No account found with that email and password."
          : error.message.toLowerCase().includes("email not confirmed")
          ? "Please confirm your email first. Check your inbox for the confirmation link."
          : error.message;
      setFormError(msg);
      setIsLoading(false);
      return;
    }
    window.location.href = "/dashboard";
  }

  return (
    <>
      <div className="space-y-1 text-center">
        <h1 className="text-xl font-semibold tracking-tight text-white">
          Welcome back
        </h1>
        <p className="text-xs text-yellow-400/50">Sign in to Sundown Companion</p>
      </div>

      {formError && (
        <div className="rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-300 text-center">
          {formError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Field label="Email address" error={errors.email?.message}>
          <input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="jane@example.com"
            {...register("email")}
          />
        </Field>
        <Field label="Password" error={errors.password?.message}>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            placeholder="Your password"
            {...register("password")}
          />
        </Field>
        <button
          type="submit"
          disabled={isLoading}
          className="w-full rounded-xl bg-white text-[#1A0800] py-2.5 text-sm font-semibold hover:bg-white/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-2"
        >
          {isLoading ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <p className="text-center text-xs text-yellow-400/45">
        No account?{" "}
        <Link href="/signup" className="text-white/60 hover:text-white transition-colors">
          Create one
        </Link>
      </p>
    </>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactElement;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-yellow-400/60 uppercase tracking-wider">
        {label}
      </label>
      <div className="[&>input]:w-full [&>input]:rounded-xl [&>input]:border [&>input]:border-yellow-400/15 [&>input]:bg-yellow-400/5 [&>input]:px-3 [&>input]:py-2.5 [&>input]:text-sm [&>input]:text-white [&>input]:placeholder-white/30 [&>input]:outline-none [&>input]:transition [&>input]:focus:border-yellow-400/30 [&>input]:focus:bg-yellow-400/8">
        {children}
      </div>
      {error && <p className="text-xs text-red-400/80">{error}</p>}
    </div>
  );
}
