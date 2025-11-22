# Omegoo Landing Page Testing Checklist

## Performance Testing (Todo #11)

### Lighthouse Audit
- [ ] Run Lighthouse audit in Chrome DevTools (Ctrl+Shift+I → Lighthouse tab)
- [ ] Target scores: Performance ≥90, Accessibility ≥95, Best Practices ≥90, SEO ≥95
- [ ] Check Core Web Vitals:
  - [ ] LCP (Largest Contentful Paint) < 2.5s
  - [ ] FID (First Input Delay) < 100ms
  - [ ] CLS (Cumulative Layout Shift) < 0.1

### Bundle Size Analysis
```bash
# Run production build
npm run build

# Check bundle size in build/static/js/
# Look for main.[hash].js size - target < 500KB gzipped
```

### Network Performance
- [ ] Test on throttled 3G network (Chrome DevTools → Network → Slow 3G)
- [ ] Verify First Contentful Paint < 1.5s
- [ ] Check lazy loading: Chat components should load only when navigating to /chat routes

### Image Optimization
- [ ] Logo files compressed (logo192.png, logo512.png)
- [ ] Consider WebP format for better compression
- [ ] Verify all images have proper width/height attributes

---

## Browser Compatibility Testing (Todo #12)

### Desktop Browsers
- [ ] **Chrome** (latest version)
  - [ ] Home page renders correctly
  - [ ] All 3 cards clickable
  - [ ] Tooltips show on hover
  - [ ] Navigation works
  
- [ ] **Firefox** (latest version)
  - [ ] Layout matches Chrome
  - [ ] Hover effects work
  - [ ] Animations smooth
  
- [ ] **Safari** (latest version on macOS)
  - [ ] Backdrop blur effects render
  - [ ] Touch-manipulation class works
  - [ ] WebRTC support confirmed
  
- [ ] **Edge** (Chromium-based)
  - [ ] Same checks as Chrome
  - [ ] Focus rings visible

### Mobile Testing

#### Responsive Design (320px minimum width)
```
Test devices:
- iPhone SE (320px × 568px)
- iPhone 12 (390px × 844px)
- Samsung Galaxy S21 (360px × 800px)
- iPad (768px × 1024px)
```

- [ ] **320px width** (iPhone SE, smallest modern device)
  - [ ] No horizontal scroll
  - [ ] All text readable (no cut-off)
  - [ ] Cards stack vertically
  - [ ] Touch targets ≥48px (buttons, info icons)
  - [ ] Privacy banner fits without overflow
  
- [ ] **375px width** (iPhone 12 Mini)
  - [ ] Comfortable spacing
  - [ ] Hero text fits (no wrapping issues)
  
- [ ] **768px width** (iPad portrait)
  - [ ] 2-column grid for cards
  - [ ] Touch areas remain large
  
- [ ] **1024px+ width** (Desktop/iPad landscape)
  - [ ] 3-column grid
  - [ ] Max-width container centers content

#### Mobile Browsers
- [ ] **iOS Safari**
  - [ ] Viewport meta tag prevents zoom
  - [ ] Touch events work (tap info icon)
  - [ ] Smooth scroll behavior
  - [ ] No pink tap highlights
  
- [ ] **Android Chrome**
  - [ ] Same checks as iOS Safari
  - [ ] Ripple effects on buttons
  - [ ] Back button behavior correct

---

## Accessibility Testing (WCAG AA)

### Keyboard Navigation
- [ ] **Tab key** moves focus between interactive elements
  - [ ] Order: Login button → Text Chat card → Info icon → Start button → Voice Chat → Video Chat
  - [ ] Focus rings visible (blue/green/purple rings around buttons)
  
- [ ] **Enter/Space** activates buttons and info icons
  
- [ ] **Escape** closes tooltips (if implemented)
  
- [ ] No keyboard traps (can Tab out of all sections)

### Screen Reader Testing

#### Windows (NVDA - Free)
```
Download: https://www.nvaccess.org/download/
1. Install NVDA
2. Press Ctrl+Alt+N to start
3. Navigate with arrow keys
```

- [ ] Page title announced: "Omegoo - Free Random Chat"
- [ ] Hero headline readable: "Free Video · Voice · Text Chat"
- [ ] Card titles announced with "article" role
- [ ] Info icon label: "Information about text chat"
- [ ] Online counters announced with "polite" live region
- [ ] Buttons have clear labels: "Start free text chat"

#### macOS (VoiceOver - Built-in)
```
Enable: System Preferences → Accessibility → VoiceOver → Enable
Use: Cmd+F5 to toggle on/off
```

- [ ] Same checks as NVDA above
- [ ] Swipe gestures work on iOS devices

### Color Contrast
```
Tool: WebAIM Contrast Checker
URL: https://webaim.org/resources/contrastchecker/
```

- [ ] **Text on backgrounds**:
  - [ ] White text on gradient: ≥4.5:1 ratio
  - [ ] Blue-300 tagline on dark card: ≥4.5:1
  - [ ] Green-100 badge text: ≥4.5:1
  
- [ ] **Interactive elements**:
  - [ ] Button text (white on blue/green/purple): ≥4.5:1
  - [ ] Focus rings visible on all backgrounds

### Motion & Animations
- [ ] Animations respect `prefers-reduced-motion` media query
- [ ] Hover effects don't cause nausea (subtle scale, no spinning)
- [ ] Pulse animations on online counters not too fast

---

## Functional Testing

### User Flows

#### Guest User (No Login)
1. [ ] Land on home page
2. [ ] See 3 cards (Text, Voice, Video)
3. [ ] Click "Start Free Text Chat"
4. [ ] Redirect to /chat/text after 800ms
5. [ ] (Chat component should load with Suspense spinner)

#### Returning User (With Login)
1. [ ] See optional login banner (if not logged in)
2. [ ] Click "Sign up" → Navigate to /login
3. [ ] Login successful → Return to home
4. [ ] Coin balance hidden from landing page
5. [ ] Click any chat mode → Direct access (no coin check on landing)

### Info Tooltips
- [ ] **Desktop**: Hover over ℹ️ icon shows tooltip
- [ ] **Mobile**: Tap ℹ️ icon shows tooltip, tap outside dismisses
- [ ] **Keyboard**: Focus info icon, press Enter shows tooltip
- [ ] Tooltip content accurate:
  - Text: "Free Random Text Chat"
  - Voice: "Free Voice Chat"
  - Video: "Free Video Chat"

### Privacy Notice
- [ ] Green banner visible below hero
- [ ] Lock icon renders
- [ ] "Privacy details" link navigates to /privacy
- [ ] Message clear: "No signup required — Anonymous Guest ID stored locally"

### Online Counters
- [ ] Real-time counts display (if socket connected)
- [ ] Fallback to "— online now" if disconnected
- [ ] Pulse animation draws attention
- [ ] Numbers update without page refresh

---

## Edge Cases & Error Handling

### Network Issues
- [ ] Offline: Show error message (not blank page)
- [ ] Slow connection: Suspense spinners prevent blank screens
- [ ] API timeout: Graceful degradation (hide online counters)

### Browser Settings
- [ ] JavaScript disabled: Show noscript message from index.html
- [ ] Cookies disabled: Guest ID still works (localStorage)
- [ ] Ad blockers: Page renders normally

### Navigation
- [ ] Direct URL: /chat/video redirects to home if not logged in
- [ ] Back button: Returns to home from chat
- [ ] Refresh: State persists (guest ID, theme)

---

## SEO Verification

### Meta Tags (index.html)
- [ ] Title: "Omegoo - Talk to Strangers | Random Video Chat..."
- [ ] Description includes "FREE" keyword
- [ ] Viewport meta present
- [ ] Open Graph tags for social sharing
- [ ] Canonical URL set

### Content
- [ ] "FREE" keyword appears 9+ times (hero, cards, badges)
- [ ] H1 tag: "Free Video · Voice · Text Chat"
- [ ] Card titles use H3 tags
- [ ] Alt text on all images/icons

### Performance Impact on SEO
- [ ] LCP < 2.5s (Google ranking factor)
- [ ] Mobile-friendly (Google Mobile-First Indexing)
- [ ] HTTPS enabled (production)
- [ ] No render-blocking resources

---

## Production Readiness

### Build Verification
```bash
# Clean build
npm run build

# Check for warnings
# Verify build/static/js and build/static/css sizes

# Test production build locally
npx serve -s build
# Open http://localhost:3000
```

- [ ] Build completes without errors
- [ ] No console warnings in browser
- [ ] All routes work in production build
- [ ] Assets load correctly (logo, favicons)

### Deployment Checks
- [ ] Environment variables set (REACT_APP_API_BASE_URL)
- [ ] Backend CORS allows frontend domain
- [ ] SSL certificate valid
- [ ] CDN configured (if using)

---

## Testing Commands

### Run Development Server
```bash
cd frontend
npm start
# Opens http://localhost:3000
```

### Run Production Build
```bash
cd frontend
npm run build
npx serve -s build
```

### Check Bundle Size
```bash
cd frontend
npm run build
ls -lh build/static/js/main.*.js
# Target: < 500KB gzipped
```

### Lighthouse Audit (Programmatic)
```bash
npm install -g lighthouse
lighthouse http://localhost:3000 --view
```

---

## Sign-Off

**Performance** ✅ / ❌  
- LCP: _____ (< 2.5s)
- Bundle size: _____ KB (< 500KB)
- Lighthouse score: _____/100

**Accessibility** ✅ / ❌  
- Keyboard navigation: Pass/Fail
- Screen reader: Pass/Fail
- Color contrast: Pass/Fail

**Mobile** ✅ / ❌  
- 320px width: Pass/Fail
- Touch targets: Pass/Fail
- Responsive: Pass/Fail

**Browsers** ✅ / ❌  
- Chrome: Pass/Fail
- Firefox: Pass/Fail
- Safari: Pass/Fail
- Edge: Pass/Fail

**Tested by**: ___________  
**Date**: ___________  
**Build version**: ___________

---

## Known Issues / Notes

<!-- Document any issues found during testing -->

1. 
2. 
3. 

---

**Ready for Production?** ✅ / ❌
