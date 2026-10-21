"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { UserCheck, Clock, ShieldCheck, ArrowLeft, LogOut, LogIn, UserPlus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface UserProfile {
  id: string;
  email: string;
  name: string;
  created_at: number;
}

export default function AccountPage() {
  const router = useRouter();
  const [user, setUser] = React.useState<UserProfile | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let isMounted = true;
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (isMounted) {
          setUser(data.user || null);
          setLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleSignOut = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setUser(null);
      toast.success("Signed out successfully.");
      router.push("/");
      router.refresh();
    } catch {
      toast.error("Failed to sign out.");
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto max-w-xl px-4 py-24 flex items-center justify-center gap-2 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span className="text-sm">Loading account...</span>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto max-w-xl px-4 py-16 sm:py-24 space-y-8 text-center">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center mx-auto">
          <UserCheck className="h-8 w-8" />
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            Account Access
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base max-w-md mx-auto leading-relaxed">
            Sign in or register to record operation history, save preferences, and inspect processing metadata.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Button asChild size="lg" className="rounded-xl gap-2 shadow-sm">
            <Link href="/login">
              <LogIn className="h-4 w-4" />
              Sign In
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="rounded-xl gap-2">
            <Link href="/register">
              <UserPlus className="h-4 w-4" />
              Create Account
            </Link>
          </Button>
        </div>

        <div className="pt-6 border-t border-border/60 text-xs text-muted-foreground max-w-sm mx-auto">
          You can still process documents without an account. Creating an account simply enables persistent operational metadata tracking.
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-3xl px-4 py-12 sm:py-16 space-y-8">
      <div className="space-y-2">
        <Button asChild variant="ghost" size="sm" className="pl-0 gap-2 mb-2 text-muted-foreground">
          <Link href="/">
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
        </Button>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Account Overview
          </h1>
          <Badge variant="success" className="text-xs">
            Active Session
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Signed in as <strong className="text-foreground">{user.email}</strong>
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-6 border-b border-border">
          <div>
            <label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
              Name
            </label>
            <p className="font-semibold text-foreground text-base mt-0.5">
              {user.name}
            </p>
          </div>
          <div>
            <label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
              Member Since
            </label>
            <p className="font-semibold text-foreground text-base mt-0.5">
              {new Date(user.created_at).toLocaleDateString(undefined, {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="font-semibold text-sm text-foreground">
            Account Features
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Link
              href="/history"
              className="flex items-center justify-between p-4 rounded-xl border border-border hover:border-primary/40 bg-card hover:bg-muted/40 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <Clock className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-medium text-sm text-foreground">Processing History</p>
                  <p className="text-xs text-muted-foreground">View your execution logs</p>
                </div>
              </div>
            </Link>

            <Link
              href="/privacy"
              className="flex items-center justify-between p-4 rounded-xl border border-border hover:border-primary/40 bg-card hover:bg-muted/40 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-medium text-sm text-foreground">Data Privacy</p>
                  <p className="text-xs text-muted-foreground">Metadata retention rules</p>
                </div>
              </div>
            </Link>
          </div>
        </div>

        <div className="pt-4 border-t border-border flex items-center justify-between">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleSignOut}
            className="gap-2 text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/20 cursor-pointer"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>

          <Button asChild variant="ghost" size="sm">
            <Link href="/#tools">Explore Tools</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
