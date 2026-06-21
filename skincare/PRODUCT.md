# Skin

## Register

Product. App UI for a single user (Beto). No marketing surface, no acquisition flow, no public docs. The tool should disappear into the nightly routine.

## Purpose

A personal nighttime skincare consultant. Open the app once a day, report how the skin is, get a suggested routine drawn from the products on hand, mark what was applied. Track visible situations (pimples, ingrown hairs, post-inflammatory marks) over time as photo timelines. The app codifies the constraints a dermatologist would impose so the user doesn't have to remember them.

## User

Beto. Adult male, mixed/oily skin, mild inflammatory acne tendency, post-inflammatory marks. Uses at night, in low light, often half-distracted. Knows what his products do but doesn't want to think about cadence ("ácido ontem? retinol amanhã?") every night. Wants the consistency without the cognitive overhead.

## Outcome

- One-tap nightly capture of skin state + post-shave flag.
- Suggested routine that respects yesterday's actives, today's state, active situations, and the current inventory.
- Confidence that no conflicting combination (acid + retinol, agressive on irritated skin) ever reaches the suggestion.
- Photo timelines per situation that show progression at a glance.

## Brand personality

Premium dark fintech. Reference set: WHOOP, Eight Sleep, Linear, Revolut Black, Cash App, Levels. Functional, quiet, masculine/unisex. Numbers in mono. Single signature accent. Restraint everywhere.

## Anti-references

- **Beauty-industry visual language.** Pink/peach palettes, serif scripts, soft pastel cards, ASMR-ish illustration. Reads as Sephora or Glossier; misses the user.
- **Generic SaaS dashboards.** Notion-cloned settings panels with tinted cream surfaces, breadcrumbs, table sidebars. The app is a daily one-screen ritual, not a product backoffice.
- **Wellness-app calm.** Headspace-style gradient blobs as content. The user wants signal and tactility, not meditation.

## Strategic principles

1. **Determinism on rails, AI on the rails.** Hard rules (no acid+retinol same night, no agressive on irritated skin) live in code as filters. The LLM picks from already-safe candidates. The user trusts the output because conflicts are impossible by construction.
2. **One screen per ritual.** Avoid screen-stacking. Anything that's not the daily decision is one tap behind a header icon.
3. **Photos as first-class evidence.** Situation tracking is a photo timeline, not a notes app. The progression IS the data.
4. **Don't ask, infer.** Yesterday's routine, time-of-day, post-shave, active situations: the suggestion should fold these in without prompting the user to re-state them.
5. **Touch-confident.** 44px+ targets, redundant visual feedback on selection (color + icon + shadow), no fragile tap zones.

## Accessibility

WCAG 2.2 AA targets. Focus-visible outlines (the user uses a phone, not a keyboard, but the kit should be sound). Body contrast 4.5:1; large 3:1. Honor `prefers-reduced-motion` for tap and reveal animations.

## Register reference

product (per impeccable convention; covered in `reference/product.md`).
