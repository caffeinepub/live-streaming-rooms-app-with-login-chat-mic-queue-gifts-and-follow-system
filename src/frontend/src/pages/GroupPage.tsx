import { useParams } from '@tanstack/react-router';
import { useGetGroup } from '@/hooks/useGroups';
import { useGetGroupMembers } from '@/hooks/useGroupMembership';
import { useUserDisplayName } from '@/hooks/useUserDisplayName';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, Clock } from 'lucide-react';
import GroupChatPanel from '@/components/group/GroupChatPanel';
import GroupMembershipControls from '@/components/group/GroupMembershipControls';

export default function GroupPage() {
  const { groupId } = useParams({ from: '/group/$groupId' });
  const groupIdBigInt = BigInt(groupId);
  
  const { data: group, isLoading: groupLoading, error: groupError } = useGetGroup(groupIdBigInt);
  const { data: members = [], isLoading: membersLoading } = useGetGroupMembers(groupIdBigInt);
  const { data: ownerName } = useUserDisplayName(group?.owner);

  if (groupLoading) {
    return (
      <div className="container py-8 px-4">
        <div className="max-w-4xl mx-auto space-y-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-8 w-1/2 mb-2" />
              <Skeleton className="h-4 w-3/4" />
            </CardHeader>
          </Card>
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (groupError || !group) {
    return (
      <div className="container py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-destructive">Group not found or failed to load.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="flex items-center gap-2 mb-2">
                  <Users className="h-6 w-6 text-primary" />
                  {group.name}
                </CardTitle>
                <CardDescription className="mb-4">
                  {group.description || 'No description'}
                </CardDescription>
                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    Owner: {ownerName}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    Created: {new Date(Number(group.createdAt) / 1000000).toLocaleDateString()}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {membersLoading ? '...' : members.length} {members.length === 1 ? 'member' : 'members'}
                  </span>
                </div>
              </div>
              <GroupMembershipControls groupId={groupIdBigInt} />
            </div>
          </CardHeader>
        </Card>

        <GroupChatPanel groupId={groupIdBigInt} />
      </div>
    </div>
  );
}
