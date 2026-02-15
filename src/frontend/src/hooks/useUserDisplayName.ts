import { useQuery } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { Principal } from '@dfinity/principal';

export function useUserDisplayName(principal: Principal | undefined) {
  const { actor, isFetching } = useActor();

  return useQuery<string>({
    queryKey: ['userDisplayName', principal?.toString()],
    queryFn: async () => {
      if (!actor || !principal) return 'Unknown';
      const profile = await actor.getUserProfile(principal);
      return profile?.displayName || principal.toString().slice(0, 8) + '...';
    },
    enabled: !!actor && !isFetching && principal !== undefined,
    staleTime: 60000, // Cache for 1 minute
  });
}
