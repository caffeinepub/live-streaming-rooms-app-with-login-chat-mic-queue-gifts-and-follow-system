import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { ChatMessage } from '@/backend';

export function useGetMessages(roomId: bigint | undefined) {
  const { actor, isFetching } = useActor();

  return useQuery<ChatMessage[]>({
    queryKey: ['messages', roomId?.toString()],
    queryFn: async () => {
      if (!actor || !roomId) return [];
      return actor.getMessages(roomId);
    },
    enabled: !!actor && !isFetching && roomId !== undefined,
    refetchInterval: 3000, // Poll every 3 seconds
  });
}

export function useSendMessage() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { roomId: bigint; content: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.sendMessage(data.roomId, data.content);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['messages', variables.roomId.toString()] });
    },
  });
}
