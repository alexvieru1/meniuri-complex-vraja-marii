import Image from "next/image";
import Link from "next/link";

export const runtime = "nodejs";

export default function AdminLoginPage({
  searchParams,
}: {
  searchParams?: { e?: string };
}) {
  const hasError = Boolean(searchParams?.e);

  return (
    <main className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center justify-center gap-2">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/logo.png"
              alt="Logo"
              width={32}
              height={32}
              className="rounded object-contain"
            />
            <span className="text-lg font-semibold text-zinc-800">
              Autentificare admin
            </span>
          </Link>
        </div>

        {hasError && (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            Email sau parolă greșite.
          </div>
        )}

        <form
          action="/api/admin/login"
          method="POST"
          className="space-y-4"
          noValidate
        >
          <div className="space-y-1">
            <label
              htmlFor="email"
              className="block text-sm font-medium text-zinc-700"
            >
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="username"
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm shadow-sm outline-none focus:border-zinc-400"
            />
          </div>

          <div className="space-y-1">
            <label
              htmlFor="password"
              className="block text-sm font-medium text-zinc-700"
            >
              Parolă
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm shadow-sm outline-none focus:border-zinc-400"
            />
          </div>

          <button
            type="submit"
            className="mt-2 w-full rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
          >
            Autentificare
          </button>
        </form>
      </div>
    </main>
  );
}
