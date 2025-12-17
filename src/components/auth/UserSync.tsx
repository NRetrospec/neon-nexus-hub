import { useEffect, ReactNode } from "react";
import { useUser } from "@clerk/clerk-react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Loader2 } from "lucide-react";

interface UserSyncProps {
  children: ReactNode;
}

/**
 * UserSync Component
 *
 * Ensures that when a user authenticates with Clerk, they also exist in Convex.
 * This component should wrap authenticated routes to auto-create users.
 *
 * Flow:
 * 1. User signs up with Clerk
 * 2. This component checks if user exists in Convex
 * 3. If not, creates them automatically
 * 4. Once created, renders children
 */
export const UserSync = ({ children }: UserSyncProps) => {
  const { user, isLoaded } = useUser();

  const dbUser = useQuery(
    api.users.getUserByClerkId,
    user ? { clerkId: user.id } : "skip"
  );

  const createUser = useMutation(api.users.createUser);

  useEffect(() => {
    const syncUser = async () => {
      if (!user || !isLoaded) return;

      // Check if query has loaded
      if (dbUser === undefined) return; // Still loading

      // If user doesn't exist in Convex, create them
      if (dbUser === null) {
        try {
          await createUser({
            clerkId: user.id,
            username: user.username || user.emailAddresses[0]?.emailAddress.split('@')[0] || "user",
            email: user.emailAddresses[0]?.emailAddress || "",
            avatar: user.imageUrl || "🎮",
          });
        } catch (error) {
          console.error("Failed to create user in Convex:", error);
        }
      }
    };

    syncUser();
  }, [user, isLoaded, dbUser, createUser]);

  // Show loading while Clerk user is loading
  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Show loading while Convex user is being fetched/created
  if (dbUser === undefined || (user && dbUser === null)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-foreground font-cyber">Setting up your account...</p>
        </div>
      </div>
    );
  }

  // User exists in both Clerk and Convex - render children
  return <>{children}</>;
};
