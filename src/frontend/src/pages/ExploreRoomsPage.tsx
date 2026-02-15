import { useGetAllRooms } from '@/hooks/useRooms';
import { useUserDisplayName } from '@/hooks/useUserDisplayName';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Link, useNavigate } from '@tanstack/react-router';
import { Video, Users, Clock } from 'lucide-react';
import type { Room } from '@/backend';

function RoomCard({ room }: { room: Room }) {
  const { data: ownerName } = useUserDisplayName(room.owner);
  const navigate = useNavigate();

  return (
    <Card className="hover:border-primary/50 transition-colors">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Video className="h-5 w-5 text-primary" />
          {room.title}
        </CardTitle>
        <CardDescription className="line-clamp-2">
          {room.description || 'No description'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
          <span className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            Host: {ownerName}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            {new Date(Number(room.createdAt) / 1000000).toLocaleDateString()}
          </span>
        </div>
        <Button 
          className="w-full"
          onClick={() => navigate({ to: '/room/$roomId', params: { roomId: room.id.toString() } })}
        >
          Join Room
        </Button>
      </CardContent>
    </Card>
  );
}

export default function ExploreRoomsPage() {
  const { data: rooms, isLoading, error } = useGetAllRooms();

  return (
    <div className="container py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col items-center text-center mb-12">
          <img 
            src="/assets/generated/streamy-logo.dim_512x512.png" 
            alt="Streamy" 
            className="h-24 w-auto mb-6"
          />
          <h1 className="text-4xl font-bold mb-3">
            Welcome to Streamy
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Join live streaming rooms, chat with others, request the mic, send gifts, and connect with your community.
          </p>
        </div>

        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Live Rooms</h2>
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
              <p className="text-destructive">Failed to load rooms. Please try again.</p>
            </div>
          )}

          {rooms && rooms.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">No rooms available yet.</p>
              <Button asChild>
                <Link to="/create-room">Create the first room</Link>
              </Button>
            </div>
          )}

          {rooms && rooms.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {rooms.map((room) => (
                <RoomCard key={room.id.toString()} room={room} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
