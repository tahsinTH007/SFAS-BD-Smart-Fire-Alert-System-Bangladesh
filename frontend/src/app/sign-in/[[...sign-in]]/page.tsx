import Link from "next/link";
import { ShieldAlert } from "lucide-react";

/**
 * Auth placeholder.
 *
 * This page previously rendered Clerk's <SignIn />, but `@clerk/nextjs` is not
 * a dependency of this project and the backend has no auth middleware, so the
 * route failed to compile. Until auth is actually wired up, the console is
 * open and this page says so rather than pretending to be a login form.
 */
export default function SignInPage() {
  return (
    <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-slate-950 px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/60 p-8 text-center">
        <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-amber-500/30 bg-amber-500/10">
          <ShieldAlert size={20} className="text-amber-400" />
        </span>

        <h1 className="text-xl font-bold tracking-tight text-slate-100">
          Authentication not configured
        </h1>

        <p className="mt-2 text-sm text-slate-400">
          SFAS-BD does not have sign-in wired up yet. The control console is
          currently open to anyone who can reach it.
        </p>

        <p className="mt-4 rounded-lg border border-slate-800 bg-slate-950/60 p-3 text-left text-xs text-slate-500">
          To enable it: install an auth provider, add route protection in
          <code className="mx-1 rounded bg-slate-800 px-1 py-0.5 text-slate-300">
            middleware.ts
          </code>
          , and add token verification to the API before deploying anywhere
          public.
        </p>

        <Link
          href="/"
          className="mt-6 inline-block rounded-lg bg-orange-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-orange-500"
        >
          Continue to console
        </Link>
      </div>
    </main>
  );
}
