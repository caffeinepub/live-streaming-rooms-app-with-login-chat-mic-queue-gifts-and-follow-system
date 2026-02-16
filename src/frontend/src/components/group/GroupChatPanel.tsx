import { useState } from 'react';
import { useGetGroupMessages, useSendGroupMessage } from '@/hooks/useGroupChat';
import { useUserDisplayName } from '@/hooks/useUserDisplayName';
import { useInternetIdentity } from '@/hooks/useInternetIdentity';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageCircle, Send } from 'lucide-react';
import { toast } from 'sonner';
import RequireAuth from '@/components/auth/RequireAuth';
import type { ChatMessage } from '@/backend';

function Message({ message }: { message: ChatMessage }) {
  const { data: senderName } = useUserDisplayName(message.sender);

  return (
    <div className="mb-3">
      <div className="flex items-baseline gap-2">
        <span className="font-medium text-sm text-primary">{senderName}</span>
        <span className="text-xs text-muted-foreground">
          {new Date(Number(message.timestamp) / 1000000).toLocaleTimeString()}
        </span>
      </div>
      <p className="text-sm mt-1">{message.content}</p>
    </div>
  );
}

export default function GroupChatPanel({ groupId }: { groupId: bigint }) {
  const { identity } = useInternetIdentity();
  const { data: messages = [], isLoading } = useGetGroupMessages(groupId);
  const sendMessage = useSendGroupMessage();
  const [content, setContent] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!content.trim()) {
      toast.error('Please enter a message');
      return;
    }

    if (content.length > 500) {
      toast.error('Message is too long (max 500 characters)');
      return;
    }

    try {
      await sendMessage.mutateAsync({ groupId, content: content.trim() });
      setContent('');
    } catch (error: any) {
      if (error.message?.includes('Not a group member')) {
        toast.error('You must join the group to send messages');
      } else {
        toast.error('Failed to send message');
      }
      console.error(error);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          Group Chat
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-64 mb-4 pr-4">
          {isLoading && <p className="text-sm text-muted-foreground">Loading messages...</p>}
          {messages.length === 0 && !isLoading && (
            <p className="text-sm text-muted-foreground">No messages yet. Start the conversation!</p>
          )}
          {messages.map((msg, idx) => (
            <Message key={idx} message={msg} />
          ))}
        </ScrollArea>

        <RequireAuth fallback={<p className="text-sm text-muted-foreground text-center py-2">Log in to chat</p>}>
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Type a message..."
              maxLength={500}
            />
            <Button type="submit" size="icon" disabled={sendMessage.isPending}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </RequireAuth>
      </CardContent>
    </Card>
  );
}
