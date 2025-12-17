# Prizes E-Commerce Store Setup Guide

## Overview
The Prizes page has been successfully implemented as an e-commerce-style rewards store where logged-in users can redeem their points for exclusive products and perks.

## Features Implemented

### 1. Database Schema
- **Prizes Table**: Stores all available prizes with details like name, description, image, point cost, category, stock, and availability
- **Redemptions Table**: Tracks user redemptions with status tracking (pending, processing, shipped, delivered, cancelled)

### 2. Backend Functions (convex/prizes.ts)
- `getAllPrizes`: Fetches all available prizes
- `getPrizesByCategory`: Filters prizes by category
- `getFeaturedPrizes`: Gets featured prizes
- `redeemPrize`: Handles the redemption process (validates points, updates stock, deducts points)
- `getUserRedemptions`: Gets user's redemption history
- `updateRedemptionStatus`: Admin function to update redemption status
- `initializeSamplePrizes`: One-time function to populate 12 sample prizes

### 3. Frontend (src/pages/Prizes.tsx)
- **E-commerce Grid Layout**: 4-column responsive grid (4x3 on desktop, adapts for mobile)
- **12 Sample Products** including:
  - Gaming Headset Pro (5,000 pts)
  - Mechanical Keyboard (7,500 pts)
  - Gaming Mouse Elite (3,500 pts)
  - $50 Gift Card (4,000 pts)
  - $25 Gift Card (2,000 pts)
  - Gaming Chair (12,000 pts)
  - 4K Gaming Monitor (15,000 pts)
  - VIP Discord Role (1,000 pts)
  - Custom Avatar (2,500 pts)
  - Gaming Bundle (6,000 pts)
  - Premium Subscription (3,000 pts)
  - Game Key Bundle (4,500 pts)

### 4. Product Cards Display
Each product card shows:
- Product image (emoji representation)
- Category badge
- Product name
- Description
- Point cost
- Stock level indicator (when low)
- Featured badge (for featured items)
- Redeem button

### 5. Key Features
- **Category Filtering**: Filter by All, Gaming Gear, Gift Cards, Digital Perks, Bundles, Subscriptions
- **User Balance Display**: Shows user's current point balance
- **Redemption Confirmation Dialog**: Two-step confirmation before redeeming
- **Stock Management**: Automatically decreases stock and disables when out of stock
- **Point Validation**: Checks if user has sufficient points before allowing redemption
- **Smooth Animations**: Framer Motion animations for cards, hover effects, and page transitions
- **Responsive Design**: Works on all screen sizes (mobile, tablet, desktop)
- **Benefits Section**: Informational cards about earning more points and rewards

## Initial Setup Instructions

### Step 1: Initialize Sample Prizes
To populate the database with the 12 sample prizes, you need to run the initialization function once:

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Open the Convex dashboard or use the Convex CLI to run the initialization:
   ```bash
   npx convex run prizes:initializeSamplePrizes
   ```

   Alternatively, you can create a temporary admin page or use the Convex dashboard's function runner to execute `initializeSamplePrizes`.

### Step 2: Verify Database
Check your Convex dashboard to ensure:
- The `prizes` table has 12 entries
- All prizes have `isAvailable: true`
- Stock levels are set correctly

### Step 3: Test the Page
1. Navigate to `/prizes` on your app
2. Sign in to see the full functionality
3. Try filtering by different categories
4. Attempt to redeem a prize (ensure you have sufficient points)

## User Flow

### For Non-Authenticated Users
- Can view all available prizes
- Can filter by category
- Cannot see their point balance
- Clicking "Redeem" prompts them to sign in

### For Authenticated Users
- See their current point balance at the top
- Can filter and browse prizes
- Click on any prize to open redemption dialog
- Confirm redemption with a two-step process:
  1. Click "Redeem" button on product card
  2. Review details in dialog and confirm
- Get instant feedback via toast notifications
- Points are automatically deducted
- Stock is automatically updated

## Customization Options

### Adding New Prizes
To add new prizes, insert records into the `prizes` table with:
```typescript
{
  name: "Prize Name",
  description: "Detailed description",
  image: "🎁", // Use emoji or image URL
  pointCost: 5000,
  category: "Gaming Gear", // Or other category
  stock: 10,
  isAvailable: true,
  featured: false, // Set to true for featured items
  createdAt: Date.now()
}
```

### Modifying Categories
Edit the `categories` array in `src/pages/Prizes.tsx` (line 70):
```typescript
const categories = ["All", "Your Category 1", "Your Category 2", ...];
```

### Styling
The page uses the existing cyberpunk gaming theme with:
- `gaming-card` class for card containers
- `font-gaming` for headings (Orbitron font)
- `font-cyber` for body text (Rajdhani font)
- Primary/accent gradient colors
- Neon glow effects on hover

## Admin Features (Future Enhancement)
The backend includes `updateRedemptionStatus` which can be used to:
- Track redemption status (pending → processing → shipped → delivered)
- Add delivery information
- Cancel redemptions

To implement admin features, create an admin dashboard that calls this mutation.

## Testing Checklist
- [ ] Page loads without errors
- [ ] All 12 products display correctly
- [ ] Category filtering works
- [ ] User balance displays for logged-in users
- [ ] Redemption dialog appears when clicking products
- [ ] Redemption succeeds with sufficient points
- [ ] Redemption fails with insufficient points
- [ ] Toast notifications appear correctly
- [ ] Stock decreases after redemption
- [ ] Page is responsive on mobile devices

## Troubleshooting

### Prizes Not Showing
- Ensure `initializeSamplePrizes` was run successfully
- Check Convex dashboard for data in `prizes` table
- Verify Convex functions are deployed

### Redemption Fails
- Check user has sufficient points
- Verify prize has stock available
- Check browser console for error messages
- Ensure user is properly authenticated

### Points Not Deducting
- Verify the mutation is completing successfully
- Check that the user's points are being updated in the database
- Ensure the Convex mutation has proper permissions

## Next Steps
Consider implementing:
1. **Redemption History Page**: Show users their past redemptions
2. **Admin Dashboard**: Manage prizes and redemption statuses
3. **Real Images**: Replace emoji with actual product images
4. **Search Functionality**: Add search bar for prizes
5. **Wishlist Feature**: Allow users to save favorite prizes
6. **Sorting Options**: Sort by price, popularity, newest, etc.
7. **Prize Details Page**: Dedicated page for each prize with more info
8. **Email Notifications**: Send confirmation emails on redemption

## Support
For issues or questions about the Prizes page implementation, check:
- Convex documentation: https://docs.convex.dev
- Project README.md
- GitHub issues (if applicable)
