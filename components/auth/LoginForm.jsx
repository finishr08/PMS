"use client";

import { useState } from "react";
import {
  Printer,
  UserRound,
  LockKeyhole,
  Eye,
  EyeOff,
  LogIn,
} from "lucide-react";

import PageContainer from "@/components/ui/PageContainer";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

export default function LoginForm() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    // Auth.js will be connected later.
  };

  return (
    <PageContainer className="max-w-105">
      <section className="app-card w-full px-7 py-7 sm:px-8">
        {/* Printer logo */}
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <Input
            id="username"
            name="username"
            label="Username"
            icon={UserRound}
            type="text"
            placeholder="Enter your username"
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />

          <Input
            id="password"
            name="password"
            label="Password"
            icon={LockKeyhole}
            type={showPassword ? "text" : "password"}
            placeholder="Enter your password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            rightElement={
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="flex h-7 w-7 cursor-pointer items-center justify-center text-text-secondary hover:text-primary"
              >
                {showPassword ? <Eye size={17} /> : <EyeOff size={17} />}
              </button>
            }
          />

          <Button type="submit" className="mt-5! min-h-11! w-full text-sm">
            <LogIn size={17} />
            Log In
          </Button>
        </form>

        <p className="mt-3 text-center text-[11px] text-text-secondary">
          Authorized users only
        </p>

        {/* Printer footer */}
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
