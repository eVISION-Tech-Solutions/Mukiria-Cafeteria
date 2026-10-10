import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useLogin } from "@/hooks/useAuth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/login")({
  head: () => ({
    meta: [{ title: "Admin Login — Mukiria Cafeteria" }],
  }),
  component: AdminLogin,
});

function AdminLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const mutation = useLogin();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await mutation.mutateAsync({ username, password });
      toast.success("Login successful");
      window.location.href = "/admin";
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Login failed");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <form onSubmit={submit} className="w-full max-w-sm space-y-4">
        <h1 className="text-2xl font-bold">Admin login</h1>
        <Input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Username" />
        <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" />
        <div className="flex items-center justify-between">
          <Button type="submit">Sign in</Button>
          <Link to="/">Back</Link>
        </div>
      </form>
    </div>
  );
}
