import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { loginUser } from "../api/api";

export default function Login({ onAuthSuccess, isAuthenticated }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await loginUser(email, password);
      onAuthSuccess(data);
    } catch (err) {
      setError(
        err?.response?.data?.detail || "Failed to login. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md card p-6 space-y-6">
        <div>
          <h1 className="text-xl font-semibold mb-1 text-textPrimary">
            Sign in to Opportunity Intel
          </h1>
          <p className="text-sm text-textSecondary">
            Track internships, jobs, and deadlines in one place.
          </p>
        </div>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-1">
            <label className="text-sm font-medium text-textPrimary">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-3 py-2 rounded-lg border border-border/60 text-sm focus:outline-none focus:ring-1 focus:ring-primary bg-slate-900 text-textPrimary placeholder:text-textSecondary/60"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-textPrimary">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3 py-2 rounded-lg border border-border/60 text-sm focus:outline-none focus:ring-1 focus:ring-primary bg-slate-900 text-textPrimary placeholder:text-textSecondary/60"
            />
          </div>
          {error && (
            <div className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-md px-3 py-2">
              {error}
            </div>
          )}
          <button
            type="submit"
            className="btn-primary w-full mt-2"
            disabled={loading}
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>
        <p className="text-xs text-textSecondary text-center">
          New here?{" "}
          <Link
            to="/register"
            className="text-primary hover:underline font-medium"
          >
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}

