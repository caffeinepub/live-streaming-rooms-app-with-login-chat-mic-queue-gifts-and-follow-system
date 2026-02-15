# Specification

## Summary
**Goal:** Replace Stream URL/HLS playback with ZEGO real-time camera live streaming per room, supporting host (owner) and audience (non-owner) roles.

**Planned changes:**
- Remove the Stream URL field and all related validation/messaging from room creation and viewing.
- Update backend room model and APIs to stop storing/requiring `streamUrl` (create room with title/description only) and regenerate frontend types to match.
- Add ZEGO UIKit Prebuilt RTC live view to the Room page: owner joins as Host (camera/mic), others join as Audience (watch in real time).
- Provide in-stream mic and camera toggle controls (via ZEGO built-in controls or wired controls).
- Implement end-to-end ZEGO kit token flow: backend `generateZegoKitToken(roomId, userId, userName)` using stored ZEGO credentials; frontend fetches token and shows actionable English errors if not configured.
- Refactor Room page media area into a single ZEGO real-time live streaming view (remove existing “Group Call” vs “Stream” tabs) while keeping existing metadata, chat, mic queue, gifts, follow UI; ensure proper init/cleanup on navigation.

**User-visible outcome:** Creating a room no longer asks for a stream URL; opening a room starts a real-time ZEGO live session where the owner can go live with camera/mic (with mic/cam controls) and other users can join as audience to watch, with existing room UI features remaining available.
