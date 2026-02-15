import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { FollowerCount } from '@/backend';
import type { Principal } from '@dfinity/principal';

export function useGetFollowerCount(user: Principal | undefined) {
  const { actor, isFetching } = useActor();

  return useQuery<FollowerCount>({
    queryKey: ['followerCount', user?.toString()],
    queryFn: async () => {
      if (!actor || !user) return { followers: BigInt(0), following: BigInt(0) };
      return actor.getFollowerCount(user);
    },
    enabled: !!actor && !isFetching && user !== undefined,
  });
}

export function useIsFollowing(follower: Principal | undefined, followee: Principal | undefined) {
  const { actor, isFetching } = useActor();

  return useQuery<boolean>({
    queryKey: ['isFollowing', follower?.toString(), followee?.toString()],
    queryFn: async () => {
      if (!actor || !follower || !followee) return false;
      return actor.isFollowing(follower, followee);
    },
    enabled: !!actor && !isFetching && follower !== undefined && followee !== undefined,
  });
}

export function useFollow() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (followee: Principal) => {
      if (!actor) throw new Error('Actor not available');
      return actor.follow(followee);
    },
    onSuccess: (_, followee) => {
      queryClient.invalidateQueries({ queryKey: ['followerCount'] });
      queryClient.invalidateQueries({ queryKey: ['isFollowing'] });
    },
  });
}

export function useUnfollow() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (followee: Principal) => {
      if (!actor) throw new Error('Actor not available');
      return actor.unfollow(followee);
    },
    onSuccess: (_, followee) => {
      queryClient.invalidateQueries({ queryKey: ['followerCount'] });
      queryClient.invalidateQueries({ queryKey: ['isFollowing'] });
    },
  });
}
