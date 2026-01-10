import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ClerkProvider, SignedIn, SignedOut } from "@clerk/clerk-react";
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
import Polls from "./pages/Polls";
import NotFound from "./pages/NotFound";
import { ThemeProvider } from "@/contexts/ThemeContext";

// Legal System
import { LegalGuard } from "@/components/legal/LegalGuard";
import { UserSync } from "@/components/auth/UserSync";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
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
                        <ProtectedRoute>
                          <UserSync>
                            <LegalGuard>
                              <Home />
                            </LegalGuard>
                          </UserSync>
                        </ProtectedRoute>
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
                        <ProtectedRoute>
                          <UserSync>
                            <LegalGuard>
                              <Home />
                            </LegalGuard>
                          </UserSync>
                        </ProtectedRoute>
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
                        <ProtectedRoute>
                          <UserSync>
                            <LegalGuard>
                              <Home />
                            </LegalGuard>
                          </UserSync>
                        </ProtectedRoute>
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
                        <ProtectedRoute>
                          <UserSync>
                            <LegalGuard>
                              <Home />
                            </LegalGuard>
                          </UserSync>
                        </ProtectedRoute>
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
                    <ProtectedRoute>
                      <UserSync>
                        <AgeVerification />
                      </UserSync>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/legal/accept-terms"
                  element={
                    <ProtectedRoute>
                      <UserSync>
                        <AcceptTerms />
                      </UserSync>
                    </ProtectedRoute>
                  }
                />

                {/* Authenticated Routes - Only for logged-in users with legal consent */}
                <Route
                  path="/home"
                  element={
                    <ProtectedRoute>
                      <UserSync>
                        <LegalGuard>
                          <Home />
                        </LegalGuard>
                      </UserSync>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/quests"
                  element={
                    <ProtectedRoute>
                      <UserSync>
                        <LegalGuard>
                          <Quests />
                        </LegalGuard>
                      </UserSync>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/leaderboard"
                  element={
                    <ProtectedRoute>
                      <UserSync>
                        <LegalGuard>
                          <Leaderboard />
                        </LegalGuard>
                      </UserSync>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/social"
                  element={
                    <ProtectedRoute>
                      <UserSync>
                        <LegalGuard>
                          <Social />
                        </LegalGuard>
                      </UserSync>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute>
                      <UserSync>
                        <LegalGuard>
                          <Profile />
                        </LegalGuard>
                      </UserSync>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/polls"
                  element={
                    <ProtectedRoute>
                      <UserSync>
                        <LegalGuard>
                          <Polls />
                        </LegalGuard>
                      </UserSync>
                    </ProtectedRoute>
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
