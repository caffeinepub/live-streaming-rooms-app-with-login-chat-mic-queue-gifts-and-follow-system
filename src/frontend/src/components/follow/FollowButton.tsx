import { useInternetIdentity } from '@/hooks/useInternetIdentity';
import { useIsFollowing, useFollow, useUnfollow } from '@/hooks/useFollow';
import { Button } from '@/components/ui/button';
import { UserPlus, UserMinus } from 'lucide-react';
import { toast } from 'sonner';
import type { Principal } from '@dfinity/principal';

export default function FollowButton({ targetPrincipal }: { targetPrincipal: Principal }) {
  const { identity } = useInternetIdentity();
  const currentPrincipal = identity?.getPrincipal();
  
  const { data: isFollowing = false } = useIsFollowing(currentPrincipal, targetPrincipal);
  const follow = useFollow();
  const unfollow = useUnfollow();

  const isSelf = currentPrincipal && currentPrincipal.toString() === targetPrincipal.toString();

  if (!identity || isSelf) {
    return null;
  }

  const handleToggleFollow = async () => {
    try {
      if (isFollowing) {
        await unfollow.mutateAsync(targetPrincipal);
        toast.success('Unfollowed');
      } else {
        await follow.mutateAsync(targetPrincipal);
        toast.success('Following!');
      }
    } catch (error) {
      toast.error('Failed to update follow status');
      console.error(error);
    }
  };

  return (
    <Button
      onClick={handleToggleFollow}
      disabled={follow.isPending || unfollow.isPending}
      variant={isFollowing ? 'outline' : 'default'}
      size="sm"
    >
      {isFollowing ? (
        <>
          <UserMinus className="h-4 w-4 mr-2" />
          Unfollow
        </>
      ) : (
        <>
          <UserPlus className="h-4 w-4 mr-2" />
          Follow
        </>
      )}
    </Button>
  );
}
