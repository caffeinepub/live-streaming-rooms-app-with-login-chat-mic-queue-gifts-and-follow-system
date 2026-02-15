import { useState } from 'react';
import { useGetGiftCatalog, useGetBalance, useSendGift, useAddBalance } from '@/hooks/useGifts';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Gift, Coins } from 'lucide-react';
import { toast } from 'sonner';
import RequireAuth from '@/components/auth/RequireAuth';
import type { Principal } from '@dfinity/principal';

const GIFT_ICONS: Record<string, string> = {
  'Rose': '/assets/generated/gift-rose.dim_256x256.png',
  'Diamond': '/assets/generated/gift-crown.dim_256x256.png',
};

export default function GiftsPanel({ roomId, roomOwnerId }: { roomId: bigint; roomOwnerId: Principal }) {
  const { data: catalog = [] } = useGetGiftCatalog();
  const { data: balance = BigInt(0) } = useGetBalance();
  const sendGift = useSendGift();
  const addBalance = useAddBalance();
  const [selectedGift, setSelectedGift] = useState<bigint | null>(null);

  const handleSendGift = async (giftId: bigint) => {
    try {
      await sendGift.mutateAsync({ recipient: roomOwnerId, giftId });
      toast.success('Gift sent!');
      setSelectedGift(null);
    } catch (error: any) {
      if (error.message?.includes('Insufficient balance')) {
        toast.error('Insufficient balance');
      } else {
        toast.error('Failed to send gift');
      }
      console.error(error);
    }
  };

  const handleAddBalance = async () => {
    try {
      await addBalance.mutateAsync(BigInt(100));
      toast.success('Balance added!');
    } catch (error) {
      toast.error('Failed to add balance');
      console.error(error);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gift className="h-5 w-5" />
          Send Gifts
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <RequireAuth>
          <div className="flex items-center justify-between p-3 bg-primary/10 rounded-lg">
            <div className="flex items-center gap-2">
              <Coins className="h-5 w-5 text-primary" />
              <span className="font-medium">Balance: {balance.toString()}</span>
            </div>
            <Button size="sm" variant="outline" onClick={handleAddBalance}>
              Add 100
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {catalog.map((gift) => (
              <button
                key={gift.id.toString()}
                onClick={() => setSelectedGift(gift.id)}
                className={`p-3 border rounded-lg hover:border-primary transition-colors ${
                  selectedGift === gift.id ? 'border-primary bg-primary/5' : 'border-border'
                }`}
              >
                <div className="flex flex-col items-center gap-2">
                  <img 
                    src={GIFT_ICONS[gift.name] || '/assets/generated/gift-star.dim_256x256.png'} 
                    alt={gift.name}
                    className="h-12 w-12 object-contain"
                  />
                  <span className="text-sm font-medium">{gift.name}</span>
                  <span className="text-xs text-muted-foreground">{gift.cost.toString()} coins</span>
                </div>
              </button>
            ))}
          </div>

          {selectedGift && (
            <Button
              onClick={() => handleSendGift(selectedGift)}
              disabled={sendGift.isPending}
              className="w-full"
            >
              Send Gift to Host
            </Button>
          )}
        </RequireAuth>
      </CardContent>
    </Card>
  );
}
