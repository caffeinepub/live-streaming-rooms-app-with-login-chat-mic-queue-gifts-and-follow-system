import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { ChatMessage } from '@/backend';

export function useGetGroupMessages(groupId: bigint | undefined) {
  const { actor, isFetching } = useActor();

  return useQuery<ChatMessage[]>({
    queryKey: ['groupMessages', groupId?.toString()],
    queryFn: async () => {
      if (!actor || !groupId) return [];
      return actor.getGroupMessages(groupId);
    },
    enabled: !!actor && !isFetching && groupId !== undefined,
    refetchInterval: 3000, // Poll every 3 seconds
  });
}

export function useSendGroupMessage() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { groupId: bigint; content: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.sendGroupMessage(data.groupId, data.content);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['groupMessages', variables.groupId.toString()] });
    },
  });
}
