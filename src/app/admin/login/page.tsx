import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createSession, getSession } from "@/lib/auth";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Image from "next/image";

async function loginAction(formData: FormData) {
  "use server";
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "";
  const ADMIN_PASS = process.env.ADMIN_PASS || "";

  if (email === ADMIN_EMAIL && password === ADMIN_PASS) {
    await createSession(email);
    redirect("/admin/dishes");
  }
  const jar = await cookies();
  jar.set("login_error", "Date incorecte", { path: "/admin/login", maxAge: 10 });
  redirect("/admin/login");
}

export default async function AdminLoginPage() {
  const session = await getSession();
  if (session) redirect("/admin/dishes");

  const jar = await cookies();
  const error = jar.get("login_error")?.value;

  return (
    <div className="mx-auto max-w-sm pt-14">
      <div className="mb-6 flex flex-col items-center justify-center gap-2">
        <Image
          src="http://asclepios-medical.ro/wp-content/uploads/2025/09/logo_patrat-300x276-1.png"
          alt="Complex Vraja Mării Logo"
          width={80}
          height={80}
          className="rounded-md object-contain"
          priority
        />
        <div className="text-center">
          <div className="text-lg font-semibold leading-tight">Complex Vraja Mării</div>
          <div className="text-xs text-zinc-500">Panou administrare</div>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle>Autentificare admin</CardTitle></CardHeader>
        <CardContent>
          {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
          <form action={loginAction} className="space-y-3">
            <div className="space-y-1">
              <label className="text-sm" htmlFor="email">Email</label>
              <Input id="email" name="email" type="email" placeholder="admin@exemplu.ro" required />
            </div>
            <div className="space-y-1">
              <label className="text-sm" htmlFor="password">Parolă</label>
              <Input id="password" name="password" type="password" placeholder="••••••••" required />
            </div>
            <Button type="submit" className="w-full">Autentifică-te</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}