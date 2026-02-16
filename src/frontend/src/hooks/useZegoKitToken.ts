import { useQuery } from '@tanstack/react-query';
import { useActor } from './useActor';
import { useInternetIdentity } from './useInternetIdentity';
import { getOrCreateGuestUserId } from '@/utils/guestUserId';

interface UseZegoKitTokenOptions {
  roomId: string;
  role: 'host' | 'audience';
  enabled?: boolean;
}

export function useZegoKitToken({ roomId, role, enabled = true }: UseZegoKitTokenOptions) {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();

  const isAuthenticated = !!identity;
  
  // For host: use authenticated principal
  // For audience: use principal if authenticated, otherwise use guest ID
  const userId = isAuthenticated 
    ? identity.getPrincipal().toString()
    : getOrCreateGuestUserId();

  return useQuery<{ token: string; userId: string }>({
    queryKey: ['zegoKitToken', roomId, userId, role],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      
      console.log('[Token Hook] Fetching token...', { roomId, userId, role });
      
      try {
        const roomIdBigInt = BigInt(roomId);
        
        let tokenString: string;
        
        if (role === 'host') {
          // Host tokens require authentication
          if (!isAuthenticated) {
            throw new Error('You must be logged in to host a stream');
          }
          console.log('[Token Hook] Requesting host token...');
          tokenString = await actor.generateHostToken(roomIdBigInt, userId);
        } else {
          // Audience tokens work for both authenticated and anonymous users
          console.log('[Token Hook] Requesting audience token...');
          tokenString = await actor.generateAudienceToken(roomIdBigInt, userId);
        }
        
        console.log('[Token Hook] ✓ Token received:', tokenString.substring(0, 50) + '...');
        
        return {
          token: tokenString,
          userId,
        };
      } catch (error: any) {
        console.error('[Token Hook] ✗ Failed to generate token:', error);
        
        // Check for specific error messages from backend
        if (error.message && error.message.includes('not configured')) {
          throw new Error('ZEGOCLOUD credentials are not yet configured. Please contact the administrator.');
        }
        
        if (error.message && error.message.includes('Unauthorized')) {
          throw new Error('You do not have permission to access this stream.');
        }
        
        if (error.message && error.message.includes('Room not found')) {
          throw new Error('This room does not exist.');
        }
        
        throw new Error('Failed to generate live streaming token. Please try again.');
      }
    },
    enabled: !!actor && !actorFetching && enabled && !!roomId,
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
