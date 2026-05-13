---
quick_id: 260513-byq
slug: fix-snapping-initial-state-and-draw-prev
status: complete
created: 2026-05-13
completed: 2026-05-13
---

# Quick Task Plan: Fix Snapping Initial State and Draw Preview

## Goal

Make nearest-node snapping behave like the examples advertise: the checked Snapping toggle should mean snapping is already enabled, and drawing should show snap feedback before the click lands.

## Suspected Root Cause

The examples render the Snapping checkbox as checked but create the editor without enabling snapping. The core engine also resolves snap candidates only on pointer down, so there is no draw-preview feedback to show that the nearest node will be reused.

## Steps

1. Add focused snapping regression tests for near-node clicks and pointer-move preview feedback.
2. Refactor core snapping so preview lookup is non-mutating while pointer-down still applies node/edge snaps.
3. Initialize example editor snapping from the host checkbox state.
4. Run focused tests, typecheck, and the broader relevant suite.
