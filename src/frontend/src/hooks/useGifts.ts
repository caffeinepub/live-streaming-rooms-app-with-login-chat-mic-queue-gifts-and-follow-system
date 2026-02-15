import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { GiftItem, GiftTransaction } from '@/backend';
import type { Principal } from '@dfinity/principal';

export function useGetGiftCatalog() {
  const { actor, isFetching } = useActor();

  return useQuery<GiftItem[]>({
    queryKey: ['giftCatalog'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getGiftCatalog();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetBalance() {
  const { actor, isFetching } = useActor();

  return useQuery<bigint>({
    queryKey: ['balance'],
    queryFn: async () => {
      if (!actor) return BigInt(0);
      return actor.getBalance();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSendGift() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { recipient: Principal; giftId: bigint }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.sendGift(data.recipient, data.giftId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['balance'] });
      queryClient.invalidateQueries({ queryKey: ['giftHistory'] });
    },
  });
}

export function useGetGiftHistory(user: Principal | undefined) {
  const { actor, isFetching } = useActor();

  return useQuery<GiftTransaction[]>({
    queryKey: ['giftHistory', user?.toString()],
    queryFn: async () => {
      if (!actor || !user) return [];
      return actor.getGiftHistory(user);
    },
    enabled: !!actor && !isFetching && user !== undefined,
    refetchInterval: 5000,
  });
}

export function useAddBalance() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (amount: bigint) => {
      if (!actor) throw new Error('Actor not available');
      return actor.addBalance(amount);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['balance'] });
    },
  });
}
