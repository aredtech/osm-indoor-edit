---
status: testing
phase: 03-topology-relations-and-validation
source:
  - 03-01-SUMMARY.md
  - 03-02-SUMMARY.md
  - 03-03-SUMMARY.md
  - 03-04-SUMMARY.md
started: 2026-05-12T13:37:53Z
updated: 2026-05-12T13:37:53Z
---

## Current Test

number: 1
name: Draw with Explicit Snapping
expected: |
  When a host enables snapping and draws a new room near an existing node or edge, the SDK should reuse the existing node ID for node snaps, split the existing way for edge snaps, and export both rooms with shared numeric node references. When snapping is not enabled, normal drawing should remain unaffected.
awaiting: user response

## Tests

### 1. Draw with Explicit Snapping
expected: When a host enables snapping and draws a new room near an existing node or edge, the SDK should reuse the existing node ID for node snaps, split the existing way for edge snaps, and export both rooms with shared numeric node references. When snapping is not enabled, normal drawing should remain unaffected.
result: [pending]

### 2. Edit Shared Geometry Safely
expected: Moving a shared wall node should update every connected room, emit host-visible update events, and refresh adapter state. Detaching a feature should clone its nodes so later edits only affect that feature, and deleting one room should preserve nodes still referenced by another room.
result: [pending]

### 3. Import and Export Shared Data
expected: Loading OsmInEdit-style shared-room JSON should rebuild editable feature and primitive state. After edits, export should preserve shared node IDs, valid unknown tags such as source:floorplan, numeric IDs, and the OsmInEdit-style elements shape.
result: [pending]

### 4. Use Relation Editing APIs
expected: A host should be able to create a relation, update relation tags, append and remove exact members, see the relation-backed record in editor state, and export the relation without the renderer trying to draw grouped relation geometry.
result: [pending]

### 5. Run Advisory Validation
expected: Calling validate() should return structured issues with severity, ruleId, message, and element references. Built-in rules should report missing tags, broken references, duplicate nodes, invalid geometry, self-intersections, and broken relation members while export remains non-blocking.
result: [pending]

### 6. Register Custom Validation Rules
expected: A host should be able to provide validation rules at editor creation time, register additional rules later, unregister them, and receive validationChanged events with structured issue payloads based on cloned snapshots.
result: [pending]

## Summary

total: 6
passed: 0
issues: 0
pending: 6
skipped: 0
blocked: 0

## Gaps

none
