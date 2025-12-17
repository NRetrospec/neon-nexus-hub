# Mobile Responsiveness Testing Checklist

## Test Environments

### Required Test Devices
- [ ] **iPhone SE (320px)** - Smallest modern mobile viewport
- [ ] **iPhone 12/13/14 (390px)** - Standard iPhone size
- [ ] **iPhone 14 Pro Max (430px)** - Largest iPhone
- [ ] **Samsung Galaxy S21 (360px)** - Standard Android
- [ ] **Samsung Galaxy S21+ (384px)**
- [ ] **iPad Mini (768px)** - Small tablet
- [ ] **iPad Pro (1024px)** - Large tablet

### Browser Testing
- [ ] Chrome Mobile (Android)
- [ ] Safari (iOS)
- [ ] Firefox Mobile
- [ ] Samsung Internet
- [ ] Chrome DevTools Responsive Mode
- [ ] Firefox Responsive Design Mode

## Landing Pages

### Index Page (/)
- [ ] Hero section displays correctly on mobile
- [ ] Video background doesn't cause performance issues
- [ ] Left-side stats hide on very small screens
- [ ] Main title is readable and doesn't wrap awkwardly
- [ ] CTA buttons stack vertically on mobile
- [ ] No horizontal scrolling at any viewport size

### Features Page (/features)
- [ ] Feature cards stack in single column on mobile
- [ ] Two columns on tablets (sm breakpoint)
- [ ] Four columns on desktop (lg breakpoint)
- [ ] Icons and text scale appropriately
- [ ] Cards are tappable with adequate spacing

### Discover Page (/discover)
- [ ] Quest preview cards display properly
- [ ] All content is readable without zooming
- [ ] No text cutoff or overflow

### Rankings Page (/rankings)
- [ ] Leaderboard table is responsive
- [ ] Player entries don't feel cramped
- [ ] Rank icons display correctly
- [ ] XP values are properly formatted

## Authenticated Pages

### Home/Dashboard (/home)
- [ ] Welcome message displays correctly
- [ ] Stats cards show 2 columns on mobile, 4 on desktop
- [ ] Stats icons and numbers are legible
- [ ] Quick action cards stack properly
- [ ] XP progress bar is visible and functional
- [ ] Quest previews fit without overflow

### Quests Page (/quests)
- [ ] Page title and description scale correctly
- [ ] Summary stats (Completed/In Progress) are readable
- [ ] Filter buttons wrap properly on small screens
- [ ] Quest cards display in appropriate grid (1-2-3 columns)
- [ ] Quest thumbnails aren't too small
- [ ] Quest metadata (XP, points, duration) is legible
- [ ] Progress bars display correctly
- [ ] Answer inputs work with mobile keyboards
- [ ] Keyboard doesn't obscure input fields

### Leaderboard Page (/leaderboard)
- [ ] Top 3 podium displays in 3 columns without crowding
- [ ] 1st place (center) is visually prominent
- [ ] Avatar images load and display correctly
- [ ] Usernames truncate if too long
- [ ] XP values are formatted and readable
- [ ] Full leaderboard table scrolls smoothly
- [ ] User's position (if not in top 10) displays correctly

### Profile Page (/profile)
- [ ] Header stacks vertically on mobile
- [ ] Avatar displays at appropriate size
- [ ] Stats grid (3 columns) isn't too cramped
- [ ] Stat values are legible
- [ ] XP progress bar displays correctly
- [ ] Bio text area works with mobile keyboard
- [ ] Edit/Save buttons are easily tappable
- [ ] Theme picker displays correctly
- [ ] Music uploader works on mobile
- [ ] Social links editor is functional
- [ ] Badges wrap properly

### Social Page (/social)
- [ ] Header and title scale correctly
- [ ] Friends/Chat toggle button works on mobile
- [ ] Mobile drawer slides in smoothly
- [ ] Create post textarea expands properly
- [ ] Post cards display without overflow
- [ ] Images in posts scale appropriately
- [ ] Like/comment/share buttons are tappable
- [ ] ChatBox displays in drawer on mobile
- [ ] Chat messages fit within viewport
- [ ] Message input works with mobile keyboard

### Prizes Page (/prizes)
- [ ] Points balance displays prominently
- [ ] Category filter buttons wrap properly
- [ ] Prize grid adjusts (1-2-3-4 columns)
- [ ] Prize cards show full content
- [ ] Prize images/emojis display correctly
- [ ] Redeem buttons are easily tappable
- [ ] Redemption modal fits on screen
- [ ] Modal scrolls if content is long

## Common Components

### Navbar
- [ ] Logo and brand name display correctly
- [ ] Desktop menu hidden on mobile
- [ ] Mobile menu button visible and functional
- [ ] Mobile menu slides in smoothly
- [ ] Navigation links are tappable (44x44px minimum)
- [ ] Auth buttons (Sign In/Up) work correctly
- [ ] User button displays on signed-in state

### Footer
- [ ] Footer grid stacks properly on mobile
- [ ] Social icons are tappable
- [ ] Link sections are readable
- [ ] Copyright and legal links wrap properly
- [ ] No awkward spacing or alignment issues

### Modals & Dialogs
- [ ] **ProfileModal**: 95vw on mobile, appropriate max-width on desktop
- [ ] **UserProfileModal**: Similar sizing to ProfileModal
- [ ] **Redemption Dialog** (Prizes): Fits on screen, scrollable if needed
- [ ] All modals have proper backdrop
- [ ] Close buttons are easily tappable
- [ ] Modal content doesn't overflow

### Cards & Gaming Elements
- [ ] Gaming cards have appropriate padding on mobile
- [ ] Neon borders and glows don't cause performance issues
- [ ] Hover effects work (or are disabled) on touch devices
- [ ] Card content doesn't overflow
- [ ] Spacing between cards is adequate

## Touch Targets

### Minimum Size Verification
- [ ] All buttons are at least 44x44px (Apple guideline)
- [ ] Icon buttons have adequate hit area
- [ ] Links have enough padding
- [ ] Form inputs are easily tappable
- [ ] Adequate spacing between adjacent tappable elements (8px+)

### Specific Components to Check
- [ ] Mobile menu toggle button
- [ ] CTA buttons in hero section
- [ ] Quest action buttons (Start, Complete, Submit)
- [ ] Social action buttons (Like, Comment, Share)
- [ ] Filter/category buttons
- [ ] Navigation links
- [ ] Close/dismiss buttons in modals
- [ ] Avatar/profile image buttons

## Typography

### Readability
- [ ] Minimum body text: 14px (0.875rem)
- [ ] Small labels: 10px (0.625rem) acceptable
- [ ] Headings scale appropriately across breakpoints
- [ ] Line height provides adequate spacing
- [ ] Text color contrast meets WCAG AA (4.5:1)
- [ ] No text cutoff or ellipsis where it shouldn't be

### Font Scaling
- [ ] Titles use responsive classes (text-3xl sm:text-4xl md:text-6xl)
- [ ] Body text scales (text-sm sm:text-base md:text-lg)
- [ ] Labels and metadata use smallest sizes (text-xs, text-[10px])
- [ ] Gaming fonts (display fonts) are legible on small screens

## Layout & Spacing

### Grid Systems
- [ ] All grids adapt at proper breakpoints
- [ ] No awkward column counts (e.g., 3 columns on 320px screen)
- [ ] Gap spacing reduces on mobile
- [ ] Cards/items don't feel cramped

### Padding & Margins
- [ ] Container padding provides breathing room
- [ ] Card padding reduces on mobile (p-4 sm:p-6)
- [ ] Section spacing is appropriate
- [ ] No excessive whitespace or too little

### Specific Areas
- [ ] Stats grids (3 columns) - adequate gap and padding
- [ ] Quest cards - proper spacing between elements
- [ ] Leaderboard podium - not too cramped
- [ ] Social posts - comfortable spacing
- [ ] Forms - inputs have proper margins

## Forms & Inputs

### Form Elements
- [ ] Input fields are large enough to tap
- [ ] Labels are properly associated
- [ ] Placeholder text is legible
- [ ] Validation messages display correctly
- [ ] Submit buttons are prominent
- [ ] Form stacks vertically on mobile

### Keyboard Behavior
- [ ] Keyboard doesn't hide input being edited
- [ ] Page scrolls to show active input
- [ ] Enter key submits where appropriate
- [ ] Tab navigation works properly
- [ ] Keyboard type is appropriate (email, number, etc.)

### Specific Forms
- [ ] Create post textarea (Social page)
- [ ] Quest answer input
- [ ] Profile bio editor
- [ ] Search/filter inputs
- [ ] Login/signup forms (if applicable)

## Images & Media

### Image Handling
- [ ] Avatar images load and display correctly
- [ ] Placeholder avatars (emojis) scale properly
- [ ] Post images are responsive
- [ ] Images don't overflow containers
- [ ] Lazy loading works (if implemented)

### Video
- [ ] Hero background video doesn't cause layout shift
- [ ] Video plays on mobile (muted, autoplay)
- [ ] Video doesn't cause performance issues
- [ ] Fallback for unsupported video formats

## Performance

### Load Time
- [ ] Initial page load under 3 seconds on 3G
- [ ] Time to interactive under 5 seconds
- [ ] No layout shift during load (CLS)
- [ ] Images load progressively

### Scrolling
- [ ] Smooth scrolling (60fps target)
- [ ] No janky animations
- [ ] Long lists scroll smoothly
- [ ] Scroll position maintained on navigation back

### Animations
- [ ] Framer Motion animations don't cause lag
- [ ] Hover effects disabled or adapted for touch
- [ ] CSS animations use transform/opacity (GPU)
- [ ] No unnecessary re-renders

## Edge Cases

### Very Small Screens (320px)
- [ ] Content is still accessible
- [ ] No horizontal scrolling
- [ ] Touch targets still adequate
- [ ] Text is still legible

### Landscape Orientation
- [ ] Layout adapts to landscape
- [ ] Content doesn't get cut off
- [ ] Navigation remains accessible
- [ ] Modals still fit on screen

### High DPI Displays
- [ ] Text remains crisp
- [ ] Icons and images look sharp
- [ ] No pixelation or blurriness

### Long Content
- [ ] Long usernames truncate properly
- [ ] Long post content doesn't break layout
- [ ] Scrollable areas have proper max heights
- [ ] "View more" or truncation where appropriate

## Browser-Specific Issues

### iOS Safari
- [ ] No 300ms tap delay (touch-action: manipulation)
- [ ] Safe area insets respected (notch/home indicator)
- [ ] Fixed positioning works correctly
- [ ] Inputs don't zoom on focus (font-size >= 16px)
- [ ] Backdrop filters work (or have fallback)

### Android Chrome
- [ ] Address bar hide/show doesn't break layout
- [ ] Pull-to-refresh doesn't interfere with app
- [ ] Ripple effects work properly
- [ ] Hardware back button handled gracefully

## Accessibility

### Touch Accessibility
- [ ] Adequate touch target sizes (44x44px)
- [ ] Touch targets have visual feedback
- [ ] Swipe gestures (if any) have alternatives
- [ ] No reliance on hover-only interactions

### Screen Readers
- [ ] ARIA labels on icon-only buttons
- [ ] Semantic HTML structure
- [ ] Focus management in modals
- [ ] Alt text on images

## Final Checks

### No Horizontal Scroll
- [ ] Test every page at 320px width
- [ ] Test every page at 375px width
- [ ] Test every page at 768px width
- [ ] No content extends beyond viewport

### Navigation Flow
- [ ] All pages accessible from mobile menu
- [ ] Back buttons work correctly
- [ ] Deep links work properly
- [ ] Breadcrumbs (if any) display correctly

### Cross-Device Consistency
- [ ] Design is consistent across devices
- [ ] Branding is recognizable on mobile
- [ ] Color scheme works on small screens
- [ ] User experience is coherent

### Production Readiness
- [ ] All console errors resolved
- [ ] No broken images or assets
- [ ] Loading states display correctly
- [ ] Error states are mobile-friendly
- [ ] Empty states are mobile-friendly

## Testing Tools

### Browser DevTools
- Responsive Design Mode (Chrome/Firefox)
- Device emulation
- Network throttling
- Lighthouse mobile audit (aim for 90+ score)

### Online Tools
- BrowserStack / LambdaTest (real device testing)
- ResponsivelyApp (multi-device preview)
- Chrome DevTools Remote Debugging (real Android devices)
- Safari Web Inspector (real iOS devices)

### Manual Testing
- Test on actual physical devices when possible
- Test with real users for usability feedback
- Test in various lighting conditions (outdoor/indoor)
- Test with one hand, two hands

## Success Metrics

### Target Scores
- [ ] Lighthouse Mobile Performance: 90+
- [ ] Lighthouse Accessibility: 95+
- [ ] First Contentful Paint: < 1.8s
- [ ] Time to Interactive: < 3.8s
- [ ] Cumulative Layout Shift: < 0.1
- [ ] No accessibility violations (aXe, WAVE)

### User Experience
- [ ] Users can complete all tasks on mobile
- [ ] No frustration points reported
- [ ] Mobile conversion rate similar to desktop
- [ ] Bounce rate acceptable on mobile
- [ ] Average session time healthy on mobile

---

## Notes for Developers

- Always test on real devices, not just emulators
- Use Chrome Remote Debugging for Android testing
- Use Safari Web Inspector for iOS testing
- Test with both WiFi and cellular data (3G/4G/5G)
- Test with different OS versions (especially older iOS/Android)
- Consider users with large text settings enabled
- Test with low-end devices (not just flagships)
- Document any known issues or limitations
- Keep this checklist updated as features are added
