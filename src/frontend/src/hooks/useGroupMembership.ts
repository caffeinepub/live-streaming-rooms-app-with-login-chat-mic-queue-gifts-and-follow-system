import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { Principal } from '@dfinity/principal';

export function useIsGroupMember(groupId: bigint | undefined, user: Principal | undefined) {
  const { actor, isFetching } = useActor();

  return useQuery<boolean>({
    queryKey: ['groupMember', groupId?.toString(), user?.toString()],
    queryFn: async () => {
      if (!actor || !groupId || !user) return false;
      return actor.isGroupMember(groupId, user);
    },
    enabled: !!actor && !isFetching && groupId !== undefined && user !== undefined,
  });
}

export function useGetGroupMembers(groupId: bigint | undefined) {
  const { actor, isFetching } = useActor();

  return useQuery<Principal[]>({
    queryKey: ['groupMembers', groupId?.toString()],
    queryFn: async () => {
      if (!actor || !groupId) return [];
      return actor.getGroupMembers(groupId);
    },
    enabled: !!actor && !isFetching && groupId !== undefined,
  });
}

export function useJoinGroup() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (groupId: bigint) => {
      if (!actor) throw new Error('Actor not available');
      return actor.joinGroup(groupId);
    },
    onSuccess: (_, groupId) => {
      queryClient.invalidateQueries({ queryKey: ['groupMember', groupId.toString()] });
      queryClient.invalidateQueries({ queryKey: ['groupMembers', groupId.toString()] });
    },
  });
}

export function useLeaveGroup() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (groupId: bigint) => {
      if (!actor) throw new Error('Actor not available');
      return actor.leaveGroup(groupId);
    },
    onSuccess: (_, groupId) => {
      queryClient.invalidateQueries({ queryKey: ['groupMember', groupId.toString()] });
      queryClient.invalidateQueries({ queryKey: ['groupMembers', groupId.toString()] });
    },
  });
}
