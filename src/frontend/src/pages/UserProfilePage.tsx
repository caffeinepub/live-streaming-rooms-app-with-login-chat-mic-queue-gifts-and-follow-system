import { useParams, Link } from '@tanstack/react-router';
import { Principal } from '@dfinity/principal';
import { useQuery } from '@tanstack/react-query';
import { useActor } from '@/hooks/useActor';
import { useGetFollowerCount } from '@/hooks/useFollow';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { ArrowLeft, Users, UserPlus } from 'lucide-react';
import FollowButton from '@/components/follow/FollowButton';
import type { UserProfile } from '@/backend';

export default function UserProfilePage() {
  const { principalText } = useParams({ from: '/profile/$principalText' });
  const principal = Principal.fromText(principalText);
  const { actor, isFetching: actorFetching } = useActor();

  const { data: profile, isLoading: profileLoading } = useQuery<UserProfile | null>({
    queryKey: ['userProfile', principalText],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getUserProfile(principal);
    },
    enabled: !!actor && !actorFetching,
  });

  const { data: followerCount, isLoading: countLoading } = useGetFollowerCount(principal);

  const isLoading = profileLoading || countLoading;

  if (isLoading) {
    return (
      <div className="container py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <Skeleton className="h-8 w-32 mb-6" />
          <Card>
            <CardHeader>
              <div className="flex items-center gap-4">
                <Skeleton className="h-20 w-20 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-4 w-32" />
                </div>
              </div>
            </CardHeader>
          </Card>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="container py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <Button variant="ghost" size="sm" asChild className="mb-6">
            <Link to="/">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Link>
          </Button>
          <div className="text-center py-12">
            <p className="text-muted-foreground">Profile not found.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <Button variant="ghost" size="sm" asChild className="mb-6">
          <Link to="/">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Link>
        </Button>

        <Card>
          <CardHeader>
            <div className="flex items-start gap-4">
              <Avatar className="h-20 w-20">
                {profile.avatarUrl && <AvatarImage src={profile.avatarUrl} alt={profile.displayName} />}
                <AvatarFallback className="text-2xl">
                  {profile.displayName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <CardTitle className="mb-2">{profile.displayName}</CardTitle>
                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                  <span className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {followerCount?.followers.toString() || '0'} followers
                  </span>
                  <span className="flex items-center gap-1">
                    <UserPlus className="h-4 w-4" />
                    {followerCount?.following.toString() || '0'} following
                  </span>
                </div>
                <FollowButton targetPrincipal={principal} />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">
              <p>Joined {new Date(Number(profile.createdAt) / 1000000).toLocaleDateString()}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
