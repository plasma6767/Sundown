"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  async function onSubmit(values: LoginFormValues) {
    setIsLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: values.email,
      password: values.password,
    });
    if (error) {
      toast.error(
        error.message === "Invalid login credentials"
          ? "Incorrect email or password."
          : error.message
      );
      setIsLoading(false);
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <>
      <div className="space-y-1 text-center">
        <h1 className="text-xl font-semibold tracking-tight text-white">
          Welcome back
        </h1>
        <p className="text-xs text-yellow-400/50">Sign in to Sundown Companion</p>
      </div>

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
      <div className="[&>input]:w-full [&>input]:rounded-xl [&>input]:border [&>input]:border-yellow-400/15 [[&>input]:bg-yellow-400/5>input]:bg-yellow-400/5 [&>input]:px-3 [&>input]:py-2.5 [&>input]:text-sm [&>input]:text-white [&>input]:placeholder-yellow-400/40 [&>input]:outline-none [&>input]:transition [&>input]:focus:border-yellow-400/30 [[&>input]:focus:bg-white/8>input]:focus:bg-yellow-400/8">
        {children}
      </div>
      {error && <p className="text-xs text-red-400/80">{error}</p>}
    </div>
  );
}
