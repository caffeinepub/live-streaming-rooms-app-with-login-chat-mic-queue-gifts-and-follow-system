import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { MicRequest, AudioClip } from '@/backend';
import type { Principal } from '@dfinity/principal';

export function useGetCurrentMicHolder(roomId: bigint | undefined) {
  const { actor, isFetching } = useActor();

  return useQuery<Principal | null>({
    queryKey: ['micHolder', roomId?.toString()],
    queryFn: async () => {
      if (!actor || !roomId) return null;
      return actor.getCurrentMicHolder(roomId);
    },
    enabled: !!actor && !isFetching && roomId !== undefined,
    refetchInterval: 5000,
  });
}

export function useGetMicQueue(roomId: bigint | undefined) {
  const { actor, isFetching } = useActor();

  return useQuery<MicRequest[]>({
    queryKey: ['micQueue', roomId?.toString()],
    queryFn: async () => {
      if (!actor || !roomId) return [];
      return actor.getMicQueue(roomId);
    },
    enabled: !!actor && !isFetching && roomId !== undefined,
    refetchInterval: 5000,
  });
}

export function useRequestMic() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (roomId: bigint) => {
      if (!actor) throw new Error('Actor not available');
      return actor.requestMic(roomId);
    },
    onSuccess: (_, roomId) => {
      queryClient.invalidateQueries({ queryKey: ['micQueue', roomId.toString()] });
    },
  });
}

export function useAcceptMicRequest() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { roomId: bigint; user: Principal }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.acceptMicRequest(data.roomId, data.user);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['micHolder', variables.roomId.toString()] });
      queryClient.invalidateQueries({ queryKey: ['micQueue', variables.roomId.toString()] });
    },
  });
}

export function useGetAudioClips(roomId: bigint | undefined) {
  const { actor, isFetching } = useActor();

  return useQuery<AudioClip[]>({
    queryKey: ['audioClips', roomId?.toString()],
    queryFn: async () => {
      if (!actor || !roomId) return [];
      return actor.getAudioClips(roomId);
    },
    enabled: !!actor && !isFetching && roomId !== undefined,
    refetchInterval: 5000,
  });
}

export function useRecordAudioClip() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { roomId: bigint; audioData: Uint8Array }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.recordAudioClip(data.roomId, data.audioData);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['audioClips', variables.roomId.toString()] });
    },
  });
}
