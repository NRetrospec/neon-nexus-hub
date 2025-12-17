# Legal System Setup - Complete Checklist

## ✅ Step 1: Deploy Convex Schema (5 minutes)

Your schema has been updated with 4 new legal tables. Deploy them:

```bash
npx convex deploy
```

**Verify**: Check Convex Dashboard → Data tab
- You should see new empty tables: `legalDocuments`, `userLegalConsents`, `ageVerifications`, `consentAuditLog`

---

## ✅ Step 2: Seed Legal Documents (2 minutes)

This creates the initial Terms of Service and Privacy Policy:

### Option A: Via Convex Dashboard (Recommended)
1. Go to https://dashboard.convex.dev
2. Select your project
3. Go to **Functions** tab
4. Find `seedLegal:seedLegalDocuments`
5. Click **Run**
6. Should see: `{ success: true, message: "Legal documents seeded successfully", ... }`

### Option B: Via CLI
```bash
npx convex run seedLegal:seedLegalDocuments
```

**Verify**: Convex Dashboard → Data → legalDocuments
- Should have 2 documents:
  - `terms_of_service` (version 1.0.0, isActive: true)
  - `privacy_policy` (version 1.0.0, isActive: true)

---

## ✅ Step 3: Configure Clerk URLs (3 minutes)

### Set Legal Document URLs in Clerk Dashboard

1. Go to https://dashboard.clerk.com
2. Select your project
3. Go to **Customization** → **Links**
4. Set the following URLs:

**Terms of Service URL:**
```
https://your-domain.com/legal/terms
```
*For local development: `http://localhost:5173/legal/terms`*

**Privacy Policy URL:**
```
https://your-domain.com/legal/privacy
```
*For local development: `http://localhost:5173/legal/privacy`*

### Configure Post-Auth Redirects

1. Still in Clerk Dashboard
2. Go to **Paths**
3. Set redirects:

**After sign up URL:**
```
/legal/age-verification
```

**After sign in URL:**
```
/home
```
*(LegalGuard will automatically redirect if legal requirements not met)*

**Sign in fallback redirect:**
```
/home
```

**Sign up fallback redirect:**
```
/legal/age-verification
```

---

## ✅ Step 4: Start Development Server

```bash
npm run dev
```

---

## ✅ Step 5: Test New User Flow (5 minutes)

### Test Scenario: New User Registration

1. **Clear your browser data** (or use incognito mode)
   - This ensures you're testing as a completely new user

2. **Go to your app** (http://localhost:5173)

3. **Click Sign Up** (via Clerk)
   - Enter email, create password, verify email

4. **After Clerk Authentication**
   - ✅ You should be redirected to `/legal/age-verification`
   - ✅ You should see the Age Verification page

5. **Enter Date of Birth**
   - Try entering age 25 (to avoid minor restrictions for testing)
   - Month: 1, Day: 1, Year: 2000
   - Click "Verify Age & Continue"

6. **Age Verification Success**
   - ✅ You should be redirected to `/legal/accept-terms`
   - ✅ You should see the Terms Acceptance page with two tabs

7. **Review Terms**
   - Click "Terms of Service" tab
   - ✅ Scroll to the bottom (scroll tracking is active)
   - ✅ Green checkmark should appear on tab when scrolled

8. **Review Privacy Policy**
   - Click "Privacy Policy" tab
   - ✅ Scroll to the bottom
   - ✅ Green checkmark should appear

9. **Accept Terms**
   - ✅ Check "I have read and agree to the Terms of Service"
   - ✅ Check "I have read and agree to the Privacy Policy"
   - (Optional) Check marketing consent
   - Click "I Accept - Enter App"

10. **Success!**
    - ✅ You should be redirected to `/home`
    - ✅ You now have full app access

### Verify in Convex Dashboard

After completing the flow, check Convex Dashboard → Data:

**ageVerifications table:**
- Should have 1 record with your userId
- Check: `ageAtVerification: 25`, `isMinor: false`

**userLegalConsents table:**
- Should have 1 record with your userId
- Check: `termsVersion: "1.0.0"`, `privacyPolicyVersion: "1.0.0"`
- Check: `ipAddress`, `userAgent`, `scrollDepthPercent`, `timeSpentSeconds`

**consentAuditLog table:**
- Should have 2+ records
- Events: `age_verified`, `terms_accepted`

---

## ✅ Step 6: Test Returning User (3 minutes)

### Test Scenario: Existing User Logs In

1. **Log out**
2. **Log back in** with the same account
3. **Should go directly to `/home`**
   - ✅ LegalGuard sees you have valid consent
   - ✅ No redirect to legal pages

### Test Protected Routes

Try navigating to:
- `/quests` ✅ Should work
- `/social` ✅ Should work
- `/profile` ✅ Should work
- `/leaderboard` ✅ Should work

All should load normally because you have valid legal consent.

---

## ✅ Step 7: Test LegalGuard Protection (2 minutes)

### Test Scenario: Block Unauthorized Access

1. **Log out**
2. **Try accessing protected route directly:**
   ```
   http://localhost:5173/home
   ```
3. ✅ Should redirect to Clerk sign-in page

### Test Scenario: Incomplete Legal Flow

To test this, you'll need to manually manipulate data (for testing only):

1. In Convex Dashboard, delete your `userLegalConsents` record
2. Log in again
3. ✅ Should be redirected to `/legal/accept-terms`
4. Accept terms again
5. ✅ Should now have access

---

## ✅ Step 8: Test Age Restrictions (3 minutes)

### Test Scenario: Minor User (13-17 years old)

1. Create new test account
2. At age verification, enter:
   - Age 16 (Year: 2009, Month: 1, Day: 1)
3. ✅ Should accept but mark as minor
4. Check Convex → ageVerifications:
   - `isMinor: true`
   - `requiresParentalConsent: false`

### Test Scenario: Block Under-13

1. Create new test account
2. At age verification, enter:
   - Age 12 (Year: 2013, Month: 1, Day: 1)
3. ✅ Should show error: "You must be at least 13 years old"
4. ✅ Account cannot proceed

---

## ✅ Step 9: Test Terms Update Flow (5 minutes)

### Simulate a Terms Update (for testing)

1. In Convex Dashboard → Functions
2. Run `legal:publishLegalDocument` with:
   ```json
   {
     "documentType": "terms_of_service",
     "version": "2.0.0",
     "content": "<h1>Updated Terms</h1><p>We made changes...</p>",
     "materialChange": true,
     "changesSummary": "Updated data sharing policy"
   }
   ```

3. Log in with existing account
4. ✅ Should be redirected to `/legal/accept-terms`
5. ✅ Should see "Updated Terms - Re-Acceptance Required" banner
6. Accept new terms
7. ✅ Check Convex → userLegalConsents: Should have 2 records (old + new)

---

## ✅ Step 10: Verify Public Routes Still Work

Test that non-protected pages are still accessible:

1. **Without logging in**, visit:
   - `/` ✅ Landing page should work
   - `/features` ✅ Should work
   - `/discover` ✅ Should work
   - `/rankings` ✅ Should work
   - `/prizes` ✅ Should work
   - `/legal/terms` ✅ Should work (public view)
   - `/legal/privacy` ✅ Should work (public view)

---

## 🎉 Success Criteria

You'll know everything is working when:

- ✅ New users **cannot** access `/home` without completing legal flow
- ✅ Age verification **blocks** under-13 users
- ✅ Terms acceptance **requires** scrolling and checking boxes
- ✅ Consent records appear in Convex with all forensic data
- ✅ Returning users with valid consent **go directly** to app
- ✅ Returning users with **outdated** consent are redirected to accept new terms
- ✅ Public routes work without authentication
- ✅ Protected routes redirect to sign-in if not authenticated
- ✅ Protected routes redirect to legal flow if authenticated but no consent

---

## 🐛 Troubleshooting

### Issue: "No active legal documents found" error
**Solution**: Run the seed function again (Step 2)

### Issue: Redirect loop between /home and /legal/accept-terms
**Solution**:
1. Check Convex Dashboard → userLegalConsents
2. Verify you have a record with current version
3. If not, delete all userLegalConsents for your user and retry flow

### Issue: Age verification page shows but no data saves
**Solution**: Check Convex deployment status. May need to redeploy.

### Issue: LegalGuard not blocking access
**Solution**:
1. Verify LegalGuard is wrapping the route in App.tsx
2. Check browser console for errors
3. Verify Convex functions are deployed

### Issue: Clerk redirect not working
**Solution**:
1. Double-check Clerk Dashboard → Paths settings
2. Use exact paths (no trailing slashes)
3. Clear browser cache/cookies

---

## 📋 Quick Reference: URLs for Clerk

Copy these into Clerk Dashboard:

**Local Development:**
- Terms URL: `http://localhost:5173/legal/terms`
- Privacy URL: `http://localhost:5173/legal/privacy`
- After sign up: `/legal/age-verification`
- After sign in: `/home`

**Production (replace with your domain):**
- Terms URL: `https://your-domain.com/legal/terms`
- Privacy URL: `https://your-domain.com/legal/privacy`
- After sign up: `/legal/age-verification`
- After sign in: `/home`

---

## 🚀 You're Done!

Your legal consent system is now fully operational.

**Next steps:**
- Review `LEGAL_IMPLEMENTATION_GUIDE.md` for legal rationale
- Customize legal documents with your actual company info
- Set up monitoring for consent rates
- Configure production IP address collection
- Have your attorney review the legal documents

**For production deployment:**
- Update placeholder email addresses (legal@neonnexus.com → your email)
- Implement real IP address collection (replace "CLIENT_IP")
- Add DOB encryption for age verification
- Configure Clerk for production domain
- Test complete flow in production environment

---

**Questions?** Check `LEGAL_SYSTEM_README.md` for detailed documentation.
