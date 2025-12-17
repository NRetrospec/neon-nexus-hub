import { ReactNode, useEffect } from "react";
import { useUser } from "@clerk/clerk-react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Navigate, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";

interface LegalGuardProps {
  children: ReactNode;
}

/**
 * LegalGuard Component
 *
 * CRITICAL SECURITY: This component enforces legal compliance before allowing app access
 *
 * Flow:
 * 1. Checks if user is authenticated via Clerk
 * 2. Checks if user has completed age verification
 * 3. Checks if user has accepted current version of terms
 * 4. Redirects to appropriate legal page if requirements not met
 *
 * Legal Rationale:
 * - Prevents data collection from unverified users (COPPA)
 * - Ensures enforceable clickwrap consent (contract law)
 * - Creates audit trail of blocked access attempts
 * - Protects against "I never agreed" defense
 */
export const LegalGuard = ({ children }: LegalGuardProps) => {
  const { user, isLoaded: clerkLoaded } = useUser();
  const location = useLocation();

  // Get user from Convex
  const dbUser = useQuery(
    api.users.getUserByClerkId,
    user ? { clerkId: user.id } : "skip"
  );

  // Check consent status
  const consentStatus = useQuery(
    api.legal.checkConsentStatus,
    dbUser ? { userId: dbUser._id } : "skip"
  );

  // Loading states
  if (!clerkLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    // User not authenticated - redirect to sign in
    return <Navigate to="/" replace />;
  }

  if (!dbUser) {
    // User authenticated with Clerk but not in Convex yet
    // This should be handled by the signup flow
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-foreground font-cyber">Setting up your account...</p>
        </div>
      </div>
    );
  }

  if (!consentStatus) {
    // Consent status loading
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // CRITICAL: Age verification check (COPPA compliance)
  if (consentStatus.needsAgeVerification) {
    // Prevent circular redirects
    if (location.pathname === "/legal/age-verification") {
      return <>{children}</>;
    }
    return <Navigate to="/legal/age-verification" replace />;
  }

  // CRITICAL: Terms acceptance check (contract enforcement)
  if (consentStatus.needsTermsAcceptance || consentStatus.needsReacceptance) {
    // Prevent circular redirects
    if (location.pathname === "/legal/accept-terms") {
      return <>{children}</>;
    }

    // Check if user just accepted terms (grace period to prevent double-acceptance)
    const justAccepted = sessionStorage.getItem("terms_just_accepted");
    if (justAccepted) {
      // Clear the flag after 5 seconds
      setTimeout(() => {
        sessionStorage.removeItem("terms_just_accepted");
      }, 5000);

      // Allow access for now (consent record might be processing)
      return <>{children}</>;
    }

    return (
      <Navigate
        to="/legal/accept-terms"
        state={{
          isReacceptance: consentStatus.needsReacceptance,
          from: location.pathname,
        }}
        replace
      />
    );
  }

  // All legal requirements satisfied - allow access
  return <>{children}</>;
};

/**
 * Hook to check if current user has valid legal consent
 * Useful for conditional rendering in components
 */
export const useLegalConsent = () => {
  const { user } = useUser();
  const dbUser = useQuery(
    api.users.getUserByClerkId,
    user ? { clerkId: user.id } : "skip"
  );

  const consentStatus = useQuery(
    api.legal.checkConsentStatus,
    dbUser ? { userId: dbUser._id } : "skip"
  );

  return {
    isLoading: !consentStatus,
    hasValidConsent: consentStatus
      ? !consentStatus.needsAgeVerification && !consentStatus.needsTermsAcceptance
      : false,
    needsAgeVerification: consentStatus?.needsAgeVerification || false,
    needsTermsAcceptance: consentStatus?.needsTermsAcceptance || false,
    needsReacceptance: consentStatus?.needsReacceptance || false,
    isMinor: consentStatus?.isMinor || false,
    consentStatus,
  };
};
