import { useListGroups } from '@/hooks/useGroups';
import { useUserDisplayName } from '@/hooks/useUserDisplayName';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Link, useNavigate } from '@tanstack/react-router';
import { Users, Clock, MessageCircle } from 'lucide-react';
import type { Group } from '@/backend';

function GroupCard({ group }: { group: Group }) {
  const { data: ownerName } = useUserDisplayName(group.owner);
  const navigate = useNavigate();

  return (
    <Card className="hover:border-primary/50 transition-colors">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          {group.name}
        </CardTitle>
        <CardDescription className="line-clamp-2">
          {group.description || 'No description'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
          <span className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            Owner: {ownerName}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            {new Date(Number(group.createdAt) / 1000000).toLocaleDateString()}
          </span>
        </div>
        <Button 
          className="w-full"
          onClick={() => navigate({ to: '/group/$groupId', params: { groupId: group.id.toString() } })}
        >
          <MessageCircle className="h-4 w-4 mr-2" />
          Open Group
        </Button>
      </CardContent>
    </Card>
  );
}

export default function ExploreGroupsPage() {
  const { data: groups, isLoading, error } = useListGroups();

  return (
    <div className="container py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col items-center text-center mb-12">
          <Users className="h-16 w-16 text-primary mb-4" />
          <h1 className="text-4xl font-bold mb-3">
            Group Chats
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Join group conversations, connect with communities, and chat with multiple people at once.
          </p>
        </div>

        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-semibold">All Groups</h2>
            <Button asChild>
              <Link to="/create-group">
                <Users className="h-4 w-4 mr-2" />
                Create Group
              </Link>
            </Button>
          </div>

          {isLoading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-6 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-full" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-10 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {error && (
            <div className="text-center py-12">
              <p className="text-destructive">Failed to load groups. Please try again.</p>
            </div>
          )}

          {groups && groups.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">No groups available yet.</p>
              <Button asChild>
                <Link to="/create-group">Create the first group</Link>
              </Button>
            </div>
          )}

          {groups && groups.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {groups.map((group) => (
                <GroupCard key={group.id.toString()} group={group} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
