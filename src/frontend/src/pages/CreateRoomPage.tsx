import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useCreateRoom } from '@/hooks/useRooms';
import { useInternetIdentity } from '@/hooks/useInternetIdentity';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import RequireAuth from '@/components/auth/RequireAuth';

export default function CreateRoomPage() {
  const navigate = useNavigate();
  const { identity } = useInternetIdentity();
  const createRoom = useCreateRoom();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error('Please enter a room title');
      return;
    }

    try {
      const roomId = await createRoom.mutateAsync({
        title: title.trim(),
        description: description.trim() || null,
      });
      toast.success('Room created successfully! You can now start streaming.');
      navigate({ to: `/room/${roomId.toString()}` });
    } catch (error) {
      toast.error('Failed to create room');
      console.error(error);
    }
  };

  return (
    <div className="container py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <RequireAuth>
          <Card>
            <CardHeader>
              <CardTitle>Create a New Live Room</CardTitle>
              <CardDescription>
                Set up your live streaming room. As the host, you'll be able to stream using your camera and microphone.
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
                  />
                </div>

                <Button type="submit" className="w-full" disabled={createRoom.isPending}>
                  {createRoom.isPending ? 'Creating...' : 'Create Room & Go Live'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </RequireAuth>
      </div>
    </div>
  );
}
