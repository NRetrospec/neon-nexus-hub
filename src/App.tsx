import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ClerkProvider, SignedIn, SignedOut, RedirectToSignIn } from "@clerk/clerk-react";
import { ConvexProvider } from "convex/react";
import { ConvexReactClient } from "convex/react";

import Index from "./pages/Index";
import Features from "./pages/Features";
import Discover from "./pages/Discover";
import Rankings from "./pages/Rankings";
import Prizes from "./pages/Prizes";
import Home from "./pages/Home";
import Quests from "./pages/Quests";
import Leaderboard from "./pages/Leaderboard";
import Social from "./pages/Social";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";
import { ThemeProvider } from "@/contexts/ThemeContext";

// Legal System
import { LegalGuard } from "@/components/legal/LegalGuard";
import { UserSync } from "@/components/auth/UserSync";
import AgeVerification from "@/pages/legal/AgeVerification";
import AcceptTerms from "@/pages/legal/AcceptTerms";
import TermsOfService from "@/pages/legal/TermsOfService";
import PrivacyPolicy from "@/pages/legal/PrivacyPolicy";

const queryClient = new QueryClient();

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
const convexUrl = import.meta.env.VITE_CONVEX_URL;

if (!clerkPubKey) throw new Error("Missing Clerk Publishable Key");
if (!convexUrl) throw new Error("Missing Convex URL");

const convex = new ConvexReactClient(convexUrl);

const AppContent = () => {
  return (
    <ConvexProvider client={convex}>
      <ThemeProvider>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                {/* Landing/Marketing Routes - Only for logged-out users */}
                <Route
                  path="/"
                  element={
                    <>
                      <SignedOut>
                        <Index />
                      </SignedOut>
                      <SignedIn>
                        <Home />
                      </SignedIn>
                    </>
                  }
                />
                <Route
                  path="/features"
                  element={
                    <>
                      <SignedOut>
                        <Features />
                      </SignedOut>
                      <SignedIn>
                        <Home />
                      </SignedIn>
                    </>
                  }
                />
                <Route
                  path="/discover"
                  element={
                    <>
                      <SignedOut>
                        <Discover />
                      </SignedOut>
                      <SignedIn>
                        <Home />
                      </SignedIn>
                    </>
                  }
                />
                <Route
                  path="/rankings"
                  element={
                    <>
                      <SignedOut>
                        <Rankings />
                      </SignedOut>
                      <SignedIn>
                        <Home />
                      </SignedIn>
                    </>
                  }
                />
                <Route
                  path="/prizes"
                  element={<Prizes />}
                />

                {/* Legal Routes - Accessible to all (part of consent flow) */}
                <Route path="/legal/terms" element={<TermsOfService />} />
                <Route path="/legal/privacy" element={<PrivacyPolicy />} />
                <Route
                  path="/legal/age-verification"
                  element={
                    <>
                      <SignedIn>
                        <UserSync>
                          <AgeVerification />
                        </UserSync>
                      </SignedIn>
                      <SignedOut>
                        <RedirectToSignIn />
                      </SignedOut>
                    </>
                  }
                />
                <Route
                  path="/legal/accept-terms"
                  element={
                    <>
                      <SignedIn>
                        <UserSync>
                          <AcceptTerms />
                        </UserSync>
                      </SignedIn>
                      <SignedOut>
                        <RedirectToSignIn />
                      </SignedOut>
                    </>
                  }
                />

                {/* Authenticated Routes - Only for logged-in users with legal consent */}
                <Route
                  path="/home"
                  element={
                    <>
                      <SignedIn>
                        <UserSync>
                          <LegalGuard>
                            <Home />
                          </LegalGuard>
                        </UserSync>
                      </SignedIn>
                      <SignedOut>
                        <RedirectToSignIn />
                      </SignedOut>
                    </>
                  }
                />
                <Route
                  path="/quests"
                  element={
                    <>
                      <SignedIn>
                        <UserSync>
                          <LegalGuard>
                            <Quests />
                          </LegalGuard>
                        </UserSync>
                      </SignedIn>
                      <SignedOut>
                        <RedirectToSignIn />
                      </SignedOut>
                    </>
                  }
                />
                <Route
                  path="/leaderboard"
                  element={
                    <>
                      <SignedIn>
                        <UserSync>
                          <LegalGuard>
                            <Leaderboard />
                          </LegalGuard>
                        </UserSync>
                      </SignedIn>
                      <SignedOut>
                        <RedirectToSignIn />
                      </SignedOut>
                    </>
                  }
                />
                <Route
                  path="/social"
                  element={
                    <>
                      <SignedIn>
                        <UserSync>
                          <LegalGuard>
                            <Social />
                          </LegalGuard>
                        </UserSync>
                      </SignedIn>
                      <SignedOut>
                        <RedirectToSignIn />
                      </SignedOut>
                    </>
                  }
                />
                <Route
                  path="/profile"
                  element={
                    <>
                      <SignedIn>
                        <UserSync>
                          <LegalGuard>
                            <Profile />
                          </LegalGuard>
                        </UserSync>
                      </SignedIn>
                      <SignedOut>
                        <RedirectToSignIn />
                      </SignedOut>
                    </>
                  }
                />

                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </ConvexProvider>
  );
};

const App = () => {
  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      afterSignUpUrl="/legal/age-verification"
      afterSignInUrl="/home"
      signUpFallbackRedirectUrl="/legal/age-verification"
      signInFallbackRedirectUrl="/home"
    >
      <AppContent />
    </ClerkProvider>
  );
};

export default App;
