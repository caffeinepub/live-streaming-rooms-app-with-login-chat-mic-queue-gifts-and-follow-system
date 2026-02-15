import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { Room } from '@/backend';

export function useGetAllRooms() {
  const { actor, isFetching } = useActor();

  return useQuery<Room[]>({
    queryKey: ['rooms'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllRooms();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetRoom(roomId: bigint | undefined) {
  const { actor, isFetching } = useActor();

  return useQuery<Room | null>({
    queryKey: ['room', roomId?.toString()],
    queryFn: async () => {
      if (!actor || !roomId) return null;
      return actor.getRoom(roomId);
    },
    enabled: !!actor && !isFetching && roomId !== undefined,
  });
}

export function useCreateRoom() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { title: string; description: string | null }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.createRoom(data.title, data.description);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
    },
  });
}
