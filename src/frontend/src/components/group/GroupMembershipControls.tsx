import { useInternetIdentity } from '@/hooks/useInternetIdentity';
import { useIsGroupMember, useJoinGroup, useLeaveGroup } from '@/hooks/useGroupMembership';
import { Button } from '@/components/ui/button';
import { UserPlus, UserMinus } from 'lucide-react';
import { toast } from 'sonner';

interface GroupMembershipControlsProps {
  groupId: bigint;
}

export default function GroupMembershipControls({ groupId }: GroupMembershipControlsProps) {
  const { identity } = useInternetIdentity();
  const { data: isMember, isLoading: membershipLoading } = useIsGroupMember(
    groupId,
    identity?.getPrincipal()
  );
  const joinGroup = useJoinGroup();
  const leaveGroup = useLeaveGroup();

  if (!identity) {
    return null;
  }

  const handleJoin = async () => {
    try {
      await joinGroup.mutateAsync(groupId);
      toast.success('Joined group successfully');
    } catch (error: any) {
      if (error.message?.includes('Already a group member')) {
        toast.error('You are already a member of this group');
      } else {
        toast.error('Failed to join group');
      }
      console.error(error);
    }
  };

  const handleLeave = async () => {
    try {
      await leaveGroup.mutateAsync(groupId);
      toast.success('Left group successfully');
    } catch (error: any) {
      if (error.message?.includes('Not a group member')) {
        toast.error('You are not a member of this group');
      } else {
        toast.error('Failed to leave group');
      }
      console.error(error);
    }
  };

  const isLoading = membershipLoading || joinGroup.isPending || leaveGroup.isPending;

  if (isMember) {
    return (
      <Button
        variant="outline"
        onClick={handleLeave}
        disabled={isLoading}
      >
        <UserMinus className="h-4 w-4 mr-2" />
        {leaveGroup.isPending ? 'Leaving...' : 'Leave Group'}
      </Button>
    );
  }

  return (
    <Button
      onClick={handleJoin}
      disabled={isLoading}
    >
      <UserPlus className="h-4 w-4 mr-2" />
      {joinGroup.isPending ? 'Joining...' : 'Join Group'}
    </Button>
  );
}
