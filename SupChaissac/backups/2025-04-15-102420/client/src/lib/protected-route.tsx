import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Redirect, Route } from "wouter";

export type UserRole = "TEACHER" | "SECRETARY" | "PRINCIPAL";

// Simplified version that doesn't use useAuth directly
export function ProtectedRoute({
  path,
  component: Component,
}: {
  path: string;
  component: () => React.JSX.Element;
}) {
  return <Route path={path} component={Component} />;
}
