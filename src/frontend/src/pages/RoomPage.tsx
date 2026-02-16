import { useParams, Link, useNavigate } from '@tanstack/react-router';
import { useGetRoom } from '@/hooks/useRooms';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, User } from 'lucide-react';
import ChatPanel from '@/components/room/ChatPanel';
import MicQueuePanel from '@/components/room/MicQueuePanel';
import AudioClipsPanel from '@/components/room/AudioClipsPanel';
import GiftsPanel from '@/components/room/GiftsPanel';
import RecentGiftsFeed from '@/components/room/RecentGiftsFeed';
import FollowButton from '@/components/follow/FollowButton';
import ZegoLiveStream from '@/components/room/ZegoLiveStream';
import { useUserDisplayName } from '@/hooks/useUserDisplayName';
import { useInternetIdentity } from '@/hooks/useInternetIdentity';

export default function RoomPage() {
  const { roomId } = useParams({ from: '/room/$roomId' });
  const navigate = useNavigate();
  const roomIdBigInt = BigInt(roomId);
  const { data: room, isLoading, error } = useGetRoom(roomIdBigInt);
  const { data: ownerName } = useUserDisplayName(room?.owner);
  const { identity } = useInternetIdentity();
  
  const isAuthenticated = !!identity;
  const isOwner = !!(isAuthenticated && room && identity.getPrincipal().toString() === room.owner.toString());

  if (isLoading) {
    return (
      <div className="container py-8 px-4">
        <Skeleton className="h-8 w-32 mb-6" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-96 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !room) {
    return (
      <div className="container py-8 px-4">
        <div className="text-center py-12">
          <p className="text-destructive mb-4">Room not found or failed to load.</p>
          <Button asChild>
            <Link to="/">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Explore
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8 px-4">
      <Button variant="ghost" size="sm" asChild className="mb-6">
        <Link to="/">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Explore
        </Link>
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{room.title}</CardTitle>
              <CardDescription className="flex items-center justify-between">
                <span>{room.description || 'No description'}</span>
              </CardDescription>
              <div className="flex items-center gap-3 pt-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => navigate({ to: '/profile/$principalText', params: { principalText: room.owner.toString() } })}
                >
                  <User className="h-4 w-4 mr-2" />
                  {ownerName}
                </Button>
                <FollowButton targetPrincipal={room.owner} />
              </div>
            </CardHeader>
            <CardContent>
              <ZegoLiveStream roomId={roomId} isHost={isOwner} />
            </CardContent>
          </Card>

          <ChatPanel roomId={roomIdBigInt} />
          <AudioClipsPanel roomId={roomIdBigInt} roomOwnerId={room.owner} />
        </div>

        <div className="space-y-6">
          <MicQueuePanel roomId={roomIdBigInt} roomOwnerId={room.owner} />
          <GiftsPanel roomId={roomIdBigInt} roomOwnerId={room.owner} />
          <RecentGiftsFeed roomOwnerId={room.owner} />
        </div>
      </div>
    </div>
  );
}
