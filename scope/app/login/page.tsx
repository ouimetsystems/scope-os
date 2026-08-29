"use client";

import { useState } from "react";
import { login } from "./actions";

export default function LoginPage() {
  const [pending, setPending] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]> | null>(null);

  async function handleSubmit(formData: FormData) {
    setPending(true);
    setErrors(null);
    const result = await login(formData);
    setPending(false);
    if (result?.error) setErrors(result.error);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-semibold mb-6 text-center">SCOPE</h1>
        <form action={handleSubmit} className="space-y-4 bg-white border rounded-lg p-6">
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              name="email"
              type="email"
              required
              autoComplete="email"
              className="w-full border rounded px-3 py-2"
            />
            {errors?.email && (
              <p className="text-red-600 text-sm mt-1">{errors.email[0]}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <input
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="w-full border rounded px-3 py-2"
            />
            {errors?.password && (
              <p className="text-red-600 text-sm mt-1">{errors.password[0]}</p>
            )}
          </div>

          {errors?.form && (
            <p className="text-red-600 text-sm">{errors.form[0]}</p>
          )}

          <button
            disabled={pending}
            className="w-full rounded bg-black text-white px-4 py-2 text-sm hover:bg-gray-800 disabled:opacity-50"
          >
            {pending ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}