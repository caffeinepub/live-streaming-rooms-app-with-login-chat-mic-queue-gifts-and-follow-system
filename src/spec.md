# Specification

## Summary
**Goal:** Add a persistent Helo/Yo-style Group Chat feature with groups, membership, and group messaging alongside the existing per-room chat.

**Planned changes:**
- Extend the Motoko backend with a Group Chat domain stored in canister state, including methods to create groups, browse/view groups, join/leave groups, and send/read group messages with sender Principal and timestamp.
- Enforce access rules: only authenticated users can create groups and send messages; membership is required to post in members-only groups (with clear errors when not a member).
- Add frontend Group Chat pages and routing: group discovery/list, group creation flow, and a group chat room page with message timeline and composer.
- Implement React Query hooks for group operations (list/get groups, membership actions, send/fetch messages) using the existing authenticated actor pattern, polling for updates and invalidating/refetching after mutations.
- Ensure all new user-facing UI text for this feature is in English.

**User-visible outcome:** Users can browse available groups, create a group (when authenticated), join/leave groups, and read/post messages in group chats with a feed-like experience that updates via polling.
