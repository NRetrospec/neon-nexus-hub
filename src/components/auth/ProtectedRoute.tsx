import { ReactNode } from "react";
import { useAuth } from "@clerk/clerk-react";
import { Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: ReactNode;
}

/**
 * ProtectedRoute Component
 *
 * CRITICAL: Prevents race conditions by waiting for Clerk to hydrate before routing
 *
 * Flow:
 * 1. Wait for Clerk to load (isLoaded === true)
 * 2. Once loaded, check authentication status
 * 3. If authenticated, render children (UserSync + LegalGuard + Page)
 * 4. If not authenticated, redirect to sign-in
 *
 * This fixes the issue where:
 * - User signs in
 * - Gets redirected to /home
 * - Page fails to render because Clerk hasn't finished loading
 * - User has to press back button to trigger re-render after Clerk loads
 *
 * By checking isLoaded first, we ensure no redirects or renders happen
 * until Clerk's authentication state is fully available.
 */
export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { isLoaded, isSignedIn } = useAuth();

  // CRITICAL: Wait for Clerk to finish loading
  // Do NOT check isSignedIn or redirect until isLoaded === true
  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-foreground font-cyber">Loading...</p>
        </div>
      </div>
    );
  }

  // Now that Clerk is loaded, we can safely check authentication
  if (!isSignedIn) {
    // User is not authenticated - redirect to home page which shows sign-in
    return <Navigate to="/" replace />;
  }

  // User is authenticated and Clerk is loaded - render protected content
  return <>{children}</>;
};
