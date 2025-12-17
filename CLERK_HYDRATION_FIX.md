# Clerk Hydration Race Condition Fix

## Problem

After sign-in or sign-up, users were redirected to protected routes (e.g., `/home`), but the page failed to render correctly on first load. Users had to press the browser back button to see the page render properly.

### Root Cause

This was a **race condition** caused by:
1. Clerk redirects user to `/home` after authentication
2. React Router tries to render the route immediately
3. The old pattern used `<SignedIn>` and `<SignedOut>` components
4. These components would evaluate **before Clerk finished hydrating**
5. `<SignedOut>` would render first and trigger `<RedirectToSignIn />`
6. This caused an invalid redirect before auth state was ready
7. Pressing back button worked because by then Clerk had finished loading

## Solution

Created a `ProtectedRoute` component that:
1. ✅ **Waits for Clerk to load** (`isLoaded === true`) before any routing decisions
2. ✅ **Shows loading state** while Clerk is hydrating
3. ✅ **Only redirects after** authentication state is confirmed
4. ✅ **No race conditions** - guarantees auth state is available before rendering

## Implementation

### New Component: `ProtectedRoute`

**File:** `src/components/auth/ProtectedRoute.tsx`

```typescript
import { ReactNode } from "react";
import { useAuth } from "@clerk/clerk-react";
import { Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { isLoaded, isSignedIn } = useAuth();

  // CRITICAL: Wait for Clerk to finish loading
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

  // Now that Clerk is loaded, check authentication
  if (!isSignedIn) {
    return <Navigate to="/" replace />;
  }

  // User is authenticated and Clerk is loaded
  return <>{children}</>;
};
```

### Updated Routing Pattern

**Before (Problematic):**
```typescript
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
        <RedirectToSignIn />  {/* Could fire before isLoaded! */}
      </SignedOut>
    </>
  }
/>
```

**After (Fixed):**
```typescript
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
```

## Routes Updated

All protected routes now use `ProtectedRoute`:

### Legal Flow Routes (require auth)
- ✅ `/legal/age-verification`
- ✅ `/legal/accept-terms`

### Main App Routes (require auth + legal consent)
- ✅ `/home`
- ✅ `/quests`
- ✅ `/leaderboard`
- ✅ `/social`
- ✅ `/profile`

### Landing Page Routes (redirect to /home if signed in)
- ✅ `/` (Index)
- ✅ `/features`
- ✅ `/discover`
- ✅ `/rankings`

All now properly wrapped with `ProtectedRoute` → `UserSync` → `LegalGuard` when user is signed in.

## Loading Flow

### First-Time Sign-In Flow:
1. User signs in via Clerk
2. Clerk redirects to `/legal/age-verification` (per `afterSignUpUrl`)
3. `ProtectedRoute` checks `isLoaded`
4. While `!isLoaded`: Shows loading spinner
5. Once `isLoaded === true`: Checks `isSignedIn`
6. If `isSignedIn === true`: Renders `<UserSync>` → `<LegalGuard>` → `<AgeVerification />`
7. `UserSync` creates user in Convex if needed
8. `LegalGuard` enforces age verification and terms acceptance
9. User completes legal flow and reaches `/home`

### Returning User Sign-In Flow:
1. User signs in via Clerk
2. Clerk redirects to `/home` (per `afterSignInUrl`)
3. `ProtectedRoute` waits for `isLoaded`
4. Renders through `UserSync` → `LegalGuard` → `<Home />`
5. `LegalGuard` checks consent status
6. If consent valid: Shows home page
7. If consent invalid: Redirects to appropriate legal page

## Key Benefits

✅ **No race conditions** - Auth state always ready before routing
✅ **No flashing redirects** - Proper loading states shown
✅ **Works on first load** - No need to press back button
✅ **Consistent behavior** - Dev and production work identically
✅ **Preserves Clerk config** - No changes to Clerk redirect URLs
✅ **Clean component hierarchy** - ProtectedRoute → UserSync → LegalGuard → Page

## Testing Checklist

- [x] Sign up flow redirects to age verification and renders correctly
- [x] Sign in flow redirects to home and renders correctly
- [x] No need to press browser back button
- [x] Loading spinner shows during Clerk hydration
- [x] Unauthenticated users get redirected to `/`
- [x] Legal guards work correctly after authentication
- [x] No console errors about navigation during hydration

## Files Modified

1. **Created:** `src/components/auth/ProtectedRoute.tsx`
   - New component that waits for Clerk to load before routing

2. **Updated:** `src/App.tsx`
   - Imported `ProtectedRoute`
   - Removed `RedirectToSignIn` import
   - Replaced all `<SignedIn>/<SignedOut>/<RedirectToSignIn>` patterns with `<ProtectedRoute>`
   - All 12 protected routes now use the new pattern

3. **Preserved:** `src/components/auth/UserSync.tsx`
   - Already had proper `isLoaded` check
   - No changes needed

4. **Preserved:** `src/components/legal/LegalGuard.tsx`
   - Already had proper `clerkLoaded` check
   - No changes needed

## Architecture

```
Route (React Router)
  └─> ProtectedRoute (waits for isLoaded, checks isSignedIn)
        └─> UserSync (creates Convex user if needed)
              └─> LegalGuard (enforces age verification and terms)
                    └─> Page Component (Home, Quests, etc.)
```

Each layer has a specific responsibility:
- **ProtectedRoute**: Clerk hydration + authentication check
- **UserSync**: Convex user creation synchronization
- **LegalGuard**: Legal compliance enforcement
- **Page**: Actual application content

## Notes

- `<SignedIn>` and `<SignedOut>` are still used on public routes (landing pages) where we show different content based on auth state
- `ProtectedRoute` uses `useAuth()` instead of `useUser()` because we only need authentication status, not full user data
- Loading state shows a spinner with "Loading..." text to indicate the app is working
- All redirects use `replace: true` to avoid polluting browser history

## Deployment Notes

This fix works with:
- ✅ Netlify deployment (SPA configuration)
- ✅ React Router (BrowserRouter)
- ✅ Clerk authentication
- ✅ No SSR required
- ✅ No HashRouter needed
- ✅ No Clerk configuration changes required

The fix is purely client-side and handles the hydration race condition at the component level.
