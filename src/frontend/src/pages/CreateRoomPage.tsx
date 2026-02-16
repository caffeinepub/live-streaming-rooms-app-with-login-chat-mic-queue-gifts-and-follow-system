import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useCreateRoom } from '@/hooks/useRooms';
import { useInternetIdentity } from '@/hooks/useInternetIdentity';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { AlertCircle, Video } from 'lucide-react';
import RequireAuth from '@/components/auth/RequireAuth';
import { requestCameraAndMicPermissions } from '@/utils/mediaPermissions';

export default function CreateRoomPage() {
  const navigate = useNavigate();
  const { identity } = useInternetIdentity();
  const createRoom = useCreateRoom();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [isRequestingPermissions, setIsRequestingPermissions] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error('Please enter a room title');
      return;
    }

    setPermissionError(null);
    setIsRequestingPermissions(true);

    try {
      // Request camera and microphone permissions before creating room
      const permissionResult = await requestCameraAndMicPermissions();
      
      if (!permissionResult.granted) {
        setPermissionError(permissionResult.error || 'Camera and microphone access is required to host a live stream.');
        setIsRequestingPermissions(false);
        return;
      }

      // Permissions granted, create the room
      const roomId = await createRoom.mutateAsync({
        title: title.trim(),
        description: description.trim() || null,
      });
      
      toast.success('Room created successfully! Starting your live stream...');
      
      // Navigate to the room page
      navigate({ to: `/room/${roomId.toString()}` });
    } catch (error: any) {
      console.error('Failed to create room:', error);
      toast.error('Failed to create room. Please try again.');
      setIsRequestingPermissions(false);
    }
  };

  return (
    <div className="container py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <RequireAuth>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Video className="h-6 w-6" />
                Create a New Live Room
              </CardTitle>
              <CardDescription>
                Set up your live streaming room. You'll need to grant camera and microphone access to start streaming.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="title">Room Title *</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter room title"
                    required
                    disabled={isRequestingPermissions || createRoom.isPending}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe your room (optional)"
                    rows={3}
                    disabled={isRequestingPermissions || createRoom.isPending}
                  />
                </div>

                {permissionError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{permissionError}</AlertDescription>
                  </Alert>
                )}

                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isRequestingPermissions || createRoom.isPending}
                >
                  {isRequestingPermissions 
                    ? 'Requesting Permissions...' 
                    : createRoom.isPending 
                    ? 'Creating Room...' 
                    : 'Create Room & Go Live'}
                </Button>

                <p className="text-sm text-muted-foreground text-center">
                  By creating a room, you'll be asked to allow camera and microphone access for live streaming.
                </p>
              </form>
            </CardContent>
          </Card>
        </RequireAuth>
      </div>
    </div>
  );
}
