"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";

const signupSchema = z
  .object({
    fullName: z.string().min(2, "Name must be at least 2 characters").max(100),
    email: z.string().email("Please enter a valid email address"),
    password: z.string().min(8, "Password must be at least 8 characters").max(72),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type SignupFormValues = z.infer<typeof signupSchema>;

export default function SignupPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormValues>({ resolver: zodResolver(signupSchema) });

  async function onSubmit(values: SignupFormValues) {
    setIsLoading(true);
    setFormError(null);
    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: {
        data: { full_name: values.fullName },
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
      },
    });
    if (error) {
      const msg = error.message.toLowerCase().includes("already registered")
        ? "An account with this email already exists. Try signing in instead."
        : error.message;
      setFormError(msg);
      setIsLoading(false);
      return;
    }
    // If email confirmation is disabled, we have a session immediately —
    // create the caregiver row now (the auth callback won't fire)
    if (data.session && data.user) {
      await supabase.from("caregivers").upsert(
        { id: data.user.id, full_name: values.fullName, email: values.email },
        { onConflict: "id", ignoreDuplicates: true }
      );
      window.location.href = "/dashboard";
      return;
    }
    // Email confirmation required — send them to the check-your-email page
    window.location.href = "/confirm";
  }

  return (
    <>
      <div className="space-y-1 text-center">
        <h1 className="text-xl font-semibold tracking-tight text-white">
          Create your account
        </h1>
        <p className="text-xs text-yellow-400/50">Set up Sundown for your loved one</p>
      </div>

      {formError && (
        <div className="rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-300 text-center">
          {formError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Field label="Your full name" error={errors.fullName?.message}>
          <input id="fullName" type="text" autoComplete="name" placeholder="Jane Smith" {...register("fullName")} />
        </Field>
        <Field label="Email address" error={errors.email?.message}>
          <input id="email" type="email" autoComplete="email" placeholder="jane@example.com" {...register("email")} />
        </Field>
        <Field label="Password" error={errors.password?.message}>
          <input id="password" type="password" autoComplete="new-password" placeholder="At least 8 characters" {...register("password")} />
        </Field>
        <Field label="Confirm password" error={errors.confirmPassword?.message}>
          <input id="confirmPassword" type="password" autoComplete="new-password" placeholder="Repeat your password" {...register("confirmPassword")} />
        </Field>
        <button
          type="submit"
          disabled={isLoading}
          className="w-full rounded-xl bg-white text-[#1A0800] py-2.5 text-sm font-semibold hover:bg-white/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-2"
        >
          {isLoading ? "Creating account…" : "Create account"}
        </button>
      </form>

      <p className="text-center text-xs text-yellow-400/45">
        Already have an account?{" "}
        <Link href="/login" className="text-white/60 hover:text-white transition-colors">
          Sign in
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
