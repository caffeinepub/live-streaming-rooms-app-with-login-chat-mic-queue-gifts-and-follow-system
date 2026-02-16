import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { Group } from '@/backend';

export function useListGroups() {
  const { actor, isFetching } = useActor();

  return useQuery<Group[]>({
    queryKey: ['groups'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listGroups();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetGroup(groupId: bigint | undefined) {
  const { actor, isFetching } = useActor();

  return useQuery<Group | null>({
    queryKey: ['group', groupId?.toString()],
    queryFn: async () => {
      if (!actor || !groupId) return null;
      return actor.getGroup(groupId);
    },
    enabled: !!actor && !isFetching && groupId !== undefined,
  });
}

export function useCreateGroup() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { name: string; description: string | null }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.createGroup(data.name, data.description);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
    },
  });
}
