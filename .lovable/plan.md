# Plan: Make the new-user onboarding flow more intuitive

Goal: a first-time visitor should always feel they know where they are, why they're answering questions, and what happens next — from landing to their first generated trip. Today the flow works but has friction points: the sign-up form gives no clear "check your email" state, onboarding is 10 mandatory steps with no skip, the progress feels endless, the pending search query gets dropped if a user is sent through onboarding, and the final "Start Exploring" screen doesn't tell the user what they'll find next.

## Target flow (after changes)

```text
Landing ──► Auth ──► (email confirm screen if needed) ──► Onboarding ──► Explore
                                                            │
                                                            └─ Skip for now ──► Explore (banner: "Finish profile")
```

## Changes

1. **Auth page — clearer state after sign-up**
   - After a successful sign-up, swap the form for a "Check your email" confirmation card with the email shown, a "Resend" link, and a "Back to sign in" link. Today the form just shows a toast and stays put, which looks like nothing happened.
   - Keep Google OAuth flow unchanged.
   - Preserve `nomaaad_pending_query` through the onboarding redirect (currently it's read in Auth but dropped after onboarding).

2. **ProtectedRoute — preserve intent across onboarding**
   - When redirecting to `/onboarding`, pass the original `location.pathname + search` as router state so Onboarding can return the user there on finish/skip.
   - Replace the empty skeleton loader with a centered compass + "Setting things up..." so the blank state doesn't look broken.

3. **Onboarding — shorter, friendlier, skippable**
   - Add a tiny "Welcome, let's set up your profile in ~1 minute" intro line under the progress bar so users know the scope up front.
   - Add a "Skip for now" link in the top bar (except on the final step). Skipping sets `onboarding_completed = true` with whatever's been answered so the user isn't blocked, and routes them to their intended destination (Explore or the pending query result).
   - Mark non-essential steps as optional and let the user press Continue without selecting (notification_prefs, travel_vibe, favorite_destinations beyond 1). Required minimum: mascot, traveler_type, monthly_budget. This drops the perceived length from 10 → 3 required.
   - Update progress copy from "1 of 10" to "Step 1 · ~1 min left" with a rough time estimate based on remaining steps.
   - Final screen: replace the generic "Start Exploring" with a 3-bullet preview of what's next ("Browse AI suggestions", "Plan your first trip in seconds", "Save places you love") so the handoff feels purposeful. Honor the saved intent (pending search query or original route).

4. **i18n — translations for new copy**
   - Add EN/FR strings for: "Check your email", "We sent a confirmation link to {email}", "Resend email", "Skip for now", "Step {n} · ~{m} min left", "Optional", "Welcome — about 1 minute", final-screen bullets.

## Technical notes (for the agent)

- Files touched: `src/pages/Auth.tsx`, `src/pages/Onboarding.tsx`, `src/components/ProtectedRoute.tsx`, `src/lib/i18n.tsx`.
- No DB or RLS changes. `onboarding_completed` already exists on `profiles` and is the gate ProtectedRoute checks.
- "Skip for now" calls the existing `useUpdateProfile` mutation with the partial answers + `onboarding_completed: true`. No new mutation needed.
- Steps stay in the same order; we only relax the `canProceed` gate for steps flagged `optional: true` in the STEPS array.
- For the post-onboarding redirect, read `location.state.from` (set by ProtectedRoute); fall back to `sessionStorage.getItem('nomaaad_pending_query')` → `/explore?q=…`; finally fall back to `/explore`.
- No new packages.

## Out of scope

- Visual redesign of Auth/Onboarding cards.
- Changes to the trip-creation flow, header, or bottom nav (covered by separate flow-focus options).
- Email template changes.
