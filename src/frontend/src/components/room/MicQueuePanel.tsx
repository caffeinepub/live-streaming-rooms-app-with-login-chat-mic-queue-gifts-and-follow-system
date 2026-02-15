import { useGetCurrentMicHolder, useGetMicQueue, useRequestMic, useAcceptMicRequest } from '@/hooks/useMic';
import { useUserDisplayName } from '@/hooks/useUserDisplayName';
import { useInternetIdentity } from '@/hooks/useInternetIdentity';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Mic, MicOff } from 'lucide-react';
import { toast } from 'sonner';
import RequireAuth from '@/components/auth/RequireAuth';
import type { Principal } from '@dfinity/principal';

export default function MicQueuePanel({ roomId, roomOwnerId }: { roomId: bigint; roomOwnerId: Principal }) {
  const { identity } = useInternetIdentity();
  const { data: currentHolder } = useGetCurrentMicHolder(roomId);
  const { data: queue = [] } = useGetMicQueue(roomId);
  const requestMic = useRequestMic();
  const acceptRequest = useAcceptMicRequest();
  const { data: holderName } = useUserDisplayName(currentHolder || undefined);

  const isOwner = identity && roomOwnerId.toString() === identity.getPrincipal().toString();
  const hasRequested = identity && queue.some(req => req.user.toString() === identity.getPrincipal().toString());

  const handleRequestMic = async () => {
    try {
      await requestMic.mutateAsync(roomId);
      toast.success('Mic request sent!');
    } catch (error) {
      toast.error('Failed to request mic');
      console.error(error);
    }
  };

  const handleAcceptRequest = async (user: Principal) => {
    try {
      await acceptRequest.mutateAsync({ roomId, user });
      toast.success('Mic request accepted!');
    } catch (error) {
      toast.error('Failed to accept request');
      console.error(error);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mic className="h-5 w-5" />
          Mic Queue
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm font-medium mb-2">Current Speaker:</p>
          {currentHolder ? (
            <div className="flex items-center gap-2 text-sm text-primary">
              <Mic className="h-4 w-4" />
              {holderName}
            </div>
          ) : (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MicOff className="h-4 w-4" />
              No one has the mic
            </div>
          )}
        </div>

        <div>
          <p className="text-sm font-medium mb-2">Queue ({queue.length}):</p>
          {queue.length === 0 ? (
            <p className="text-sm text-muted-foreground">No pending requests</p>
          ) : (
            <div className="space-y-2">
              {queue.map((req, idx) => (
                <QueueItem
                  key={idx}
                  request={req}
                  isOwner={!!isOwner}
                  onAccept={() => handleAcceptRequest(req.user)}
                />
              ))}
            </div>
          )}
        </div>

        <RequireAuth>
          {!hasRequested && (
            <Button onClick={handleRequestMic} disabled={requestMic.isPending} className="w-full">
              Request Mic
            </Button>
          )}
          {hasRequested && (
            <p className="text-sm text-muted-foreground text-center">Request pending...</p>
          )}
        </RequireAuth>
      </CardContent>
    </Card>
  );
}

function QueueItem({ request, isOwner, onAccept }: { request: any; isOwner: boolean; onAccept: () => void }) {
  const { data: userName } = useUserDisplayName(request.user);

  return (
    <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
      <span className="text-sm">{userName}</span>
      {isOwner && (
        <Button size="sm" variant="outline" onClick={onAccept}>
          Accept
        </Button>
      )}
    </div>
  );
}
