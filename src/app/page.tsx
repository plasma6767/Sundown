import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="text-5xl font-bold tracking-tight text-foreground">
          Sundown
        </h1>
        <p className="mt-4 text-xl text-muted-foreground">
          A voice companion that knows your loved one — and stays with them when
          you can&apos;t.
        </p>
        <div className="mt-10 flex items-center justify-center gap-4">
          <Link
            href="/signup"
            className="rounded-md bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            Get started
          </Link>
          <Link
            href="/login"
            className="text-sm font-semibold text-foreground hover:text-primary"
          >
            Sign in →
          </Link>
        </div>
      </div>
    </main>
  );
}
