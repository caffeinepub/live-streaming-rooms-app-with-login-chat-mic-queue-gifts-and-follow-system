import { useQuery } from '@tanstack/react-query';
import { useActor } from './useActor';
import { useInternetIdentity } from './useInternetIdentity';
import { useGetCallerUserProfile } from './useCurrentUser';

export function useZegoKitToken(roomId: string) {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();
  const { data: userProfile } = useGetCallerUserProfile();

  const isAuthenticated = !!identity;
  const userId = identity?.getPrincipal().toString() || '';

  return useQuery<string>({
    queryKey: ['zegoKitToken', roomId, userId],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      if (!isAuthenticated) throw new Error('User must be authenticated');
      
      // Check if the backend method exists
      if (typeof (actor as any).generateZegoKitToken !== 'function') {
        throw new Error('Live streaming feature is not yet configured on the backend.');
      }
      
      try {
        const roomIdBigInt = BigInt(roomId);
        const token = await (actor as any).generateZegoKitToken(roomIdBigInt, userId);
        return token;
      } catch (error: any) {
        console.error('Failed to generate ZEGO kit token:', error);
        
        // Check for specific error messages from backend
        if (error.message && error.message.includes('not configured')) {
          throw new Error('ZEGOCLOUD credentials are not configured. Please contact the administrator.');
        }
        
        throw new Error('Failed to generate live streaming token. Please try again.');
      }
    },
    enabled: !!actor && !actorFetching && isAuthenticated && !!roomId,
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
