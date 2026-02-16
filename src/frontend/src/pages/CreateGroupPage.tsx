import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useCreateGroup } from '@/hooks/useGroups';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Users } from 'lucide-react';
import { toast } from 'sonner';
import RequireAuth from '@/components/auth/RequireAuth';

function CreateGroupForm() {
  const navigate = useNavigate();
  const createGroup = useCreateGroup();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error('Please enter a group name');
      return;
    }

    if (name.length > 100) {
      toast.error('Group name is too long (max 100 characters)');
      return;
    }

    if (description.length > 500) {
      toast.error('Description is too long (max 500 characters)');
      return;
    }

    try {
      const groupId = await createGroup.mutateAsync({
        name: name.trim(),
        description: description.trim() || null,
      });
      toast.success('Group created successfully!');
      navigate({ to: '/group/$groupId', params: { groupId: groupId.toString() } });
    } catch (error) {
      toast.error('Failed to create group');
      console.error(error);
    }
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-6 w-6 text-primary" />
          Create New Group
        </CardTitle>
        <CardDescription>
          Start a new group chat and invite others to join the conversation.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Group Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter group name"
              maxLength={100}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this group about?"
              maxLength={500}
              rows={4}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate({ to: '/groups' })}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createGroup.isPending}
              className="flex-1"
            >
              {createGroup.isPending ? 'Creating...' : 'Create Group'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export default function CreateGroupPage() {
  return (
    <div className="container py-8 px-4">
      <RequireAuth>
        <CreateGroupForm />
      </RequireAuth>
    </div>
  );
}
