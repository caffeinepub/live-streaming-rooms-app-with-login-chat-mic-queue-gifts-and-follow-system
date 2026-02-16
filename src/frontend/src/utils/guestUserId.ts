const GUEST_USER_ID_KEY = 'streamy_guest_user_id';

/**
 * Generate a stable guest user ID for anonymous viewers
 * Persists across page reloads within the same browser session
 */
export function getOrCreateGuestUserId(): string {
  // Try to get existing guest ID from sessionStorage
  let guestId = sessionStorage.getItem(GUEST_USER_ID_KEY);
  
  if (!guestId) {
    // Generate a new guest ID
    guestId = `guest_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    sessionStorage.setItem(GUEST_USER_ID_KEY, guestId);
  }
  
  return guestId;
}

/**
 * Clear the guest user ID (useful on logout or session end)
 */
export function clearGuestUserId(): void {
  sessionStorage.removeItem(GUEST_USER_ID_KEY);
}
