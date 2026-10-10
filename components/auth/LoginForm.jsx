"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

import {
  Printer,
  UserRound,
  LockKeyhole,
  Eye,
  EyeOff,
  LogIn,
  Loader2,
} from "lucide-react";

import PageContainer from "@/components/ui/PageContainer";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

export default function LoginForm() {
  const router = useRouter();

  // Form state
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Authentication state
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState("");

  // Handle login
  async function handleSubmit(event) {
    event.preventDefault();

    if (isLoading) return;

    setLoginError("");
    setIsLoading(true);

    try {
      const result = await signIn("credentials", {
        username: username.trim(),
        password,
        redirect: false,
      });

      if (!result || result.error) {
        setLoginError("Invalid username or password.");
        return;
      }

      // Redirect to Welcome page
      router.replace("/");
      router.refresh();
    } catch (error) {
      setLoginError("Unable to sign in. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <PageContainer className="max-w-105">
      <section className="app-card w-full px-7 py-7 sm:px-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto flex h-17.5 w-17.5 items-center justify-center rounded-full bg-primary-light">
            <Printer size={36} strokeWidth={1.8} className="text-primary" />
          </div>

          <h1 className="mt-5 text-[21px] font-bold tracking-tight text-text-primary">
            Print Management System
          </h1>

          <p className="mt-1 text-xs text-text-secondary">
            Secure access to printing operations
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          {/* Username */}
          <Input
            id="username"
            name="username"
            label="Username"
            icon={UserRound}
            type="text"
            placeholder="Enter your username"
            autoComplete="username"
            value={username}
            onChange={(event) => {
              setUsername(event.target.value);

              if (loginError) {
                setLoginError("");
              }
            }}
            disabled={isLoading}
            required
          />

          {/* Password */}
          <Input
            id="password"
            name="password"
            label="Password"
            icon={LockKeyhole}
            type={showPassword ? "text" : "password"}
            placeholder="Enter your password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => {
              setPassword(event.target.value);

              if (loginError) {
                setLoginError("");
              }
            }}
            disabled={isLoading}
            required
            rightElement={
              <button
                type="button"
                onClick={() => {
                  setShowPassword((prev) => !prev);
                }}
                disabled={isLoading}
                aria-label={showPassword ? "Hide password" : "Show password"}
                aria-pressed={showPassword}
                className="flex h-7 w-7 cursor-pointer items-center justify-center text-text-secondary transition-colors hover:text-primary disabled:cursor-not-allowed"
              >
                {showPassword ? <Eye size={17} /> : <EyeOff size={17} />}
              </button>
            }
          />

          {/* Authentication Error */}
          {loginError && (
            <div
              role="alert"
              className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-center text-xs font-medium text-red-600"
            >
              {loginError}
            </div>
          )}

          {/* Login Button */}
          <Button
            type="submit"
            disabled={isLoading}
            className="mt-5! min-h-11! w-full text-sm"
          >
            {isLoading ? (
              <>
                <Loader2 size={17} className="animate-spin" />
                <span>Signing in...</span>
              </>
            ) : (
              <>
                <LogIn size={17} />
                <span>Log In</span>
              </>
            )}
          </Button>
        </form>

        {/* Authorization Note */}
        <p className="mt-3 text-center text-[11px] text-text-secondary">
          Authorized users only
        </p>

        {/* Printer Status Footer */}
        <div className="mt-6 border-t border-border pt-5">
          <div className="flex flex-wrap items-center justify-center gap-3 text-[11px]">
            <Printer size={16} className="text-text-secondary" />

            <span className="text-text-secondary">
              Printer: HP LaserJet 3055
            </span>

            <span className="inline-flex items-center gap-1.5 font-medium text-success">
              <span className="h-2 w-2 rounded-full bg-success" />
              Demo Ready
            </span>
          </div>
        </div>
      </section>
    </PageContainer>
  );
}
