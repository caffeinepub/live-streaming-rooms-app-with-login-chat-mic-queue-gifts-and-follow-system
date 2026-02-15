import { useGetGiftHistory } from '@/hooks/useGifts';
import { useGetGiftCatalog } from '@/hooks/useGifts';
import { useUserDisplayName } from '@/hooks/useUserDisplayName';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Gift } from 'lucide-react';
import type { Principal } from '@dfinity/principal';
import type { GiftTransaction } from '@/backend';

function GiftItem({ transaction }: { transaction: GiftTransaction }) {
  const { data: senderName } = useUserDisplayName(transaction.sender);
  const { data: recipientName } = useUserDisplayName(transaction.recipient);
  const { data: catalog = [] } = useGetGiftCatalog();
  
  const gift = catalog.find(g => g.id === transaction.giftId);

  return (
    <div className="mb-3 p-2 bg-muted/30 rounded">
      <div className="flex items-center gap-2 text-sm">
        <Gift className="h-4 w-4 text-primary" />
        <span className="font-medium">{senderName}</span>
        <span className="text-muted-foreground">sent</span>
        <span className="font-medium">{gift?.name || 'a gift'}</span>
        <span className="text-muted-foreground">to</span>
        <span className="font-medium">{recipientName}</span>
      </div>
      <p className="text-xs text-muted-foreground mt-1">
        {new Date(Number(transaction.timestamp) / 1000000).toLocaleTimeString()}
      </p>
    </div>
  );
}

export default function RecentGiftsFeed({ roomOwnerId }: { roomOwnerId: Principal }) {
  const { data: gifts = [] } = useGetGiftHistory(roomOwnerId);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gift className="h-5 w-5" />
          Recent Gifts
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-48">
          {gifts.length === 0 ? (
            <p className="text-sm text-muted-foreground">No gifts sent yet</p>
          ) : (
            <div>
              {gifts.slice(-10).reverse().map((gift, idx) => (
                <GiftItem key={idx} transaction={gift} />
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
