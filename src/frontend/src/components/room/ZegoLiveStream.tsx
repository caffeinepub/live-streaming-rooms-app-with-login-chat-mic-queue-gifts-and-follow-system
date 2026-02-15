import { useEffect, useRef, useState } from 'react';
import { useZegoKitToken } from '@/hooks/useZegoKitToken';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, Info } from 'lucide-react';

interface ZegoLiveStreamProps {
  roomId: string;
  isHost: boolean;
}

export default function ZegoLiveStream({ roomId, isHost }: ZegoLiveStreamProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const zegoInstanceRef = useRef<any>(null);
  const [sdkError, setSdkError] = useState<string | null>(null);
  
  const { data: kitToken, isLoading, error } = useZegoKitToken(roomId);

  useEffect(() => {
    // Check if ZEGO SDK is available
    if (!window.ZegoUIKitPrebuilt) {
      setSdkError('Live streaming SDK could not be loaded. Please check your internet connection and refresh the page.');
      return;
    }

    // Wait for token and container
    if (!kitToken || !containerRef.current) {
      return;
    }

    // Prevent duplicate initialization
    if (zegoInstanceRef.current) {
      return;
    }

    try {
      // Create ZEGO instance
      const zp = window.ZegoUIKitPrebuilt.create(kitToken);
      zegoInstanceRef.current = zp;

      // Determine role based on isHost prop
      const role = isHost 
        ? window.ZegoUIKitPrebuilt.Host 
        : window.ZegoUIKitPrebuilt.Audience;

      // Join room with LiveStreaming mode
      zp.joinRoom({
        container: containerRef.current,
        scenario: {
          mode: window.ZegoUIKitPrebuilt.LiveStreaming,
          config: {
            role,
          },
        },
        showPreJoinView: false,
        turnOnCameraWhenJoining: isHost,
        turnOnMicrophoneWhenJoining: isHost,
        showMyCameraToggleButton: isHost,
        showMyMicrophoneToggleButton: isHost,
        showAudioVideoSettingsButton: isHost,
        showScreenSharingButton: isHost,
        showTextChat: false,
        showUserList: true,
        maxUsers: 50,
        layout: 'Auto',
        showLayoutButton: false,
      });
    } catch (err: any) {
      console.error('Failed to initialize ZEGO live stream:', err);
      setSdkError('Failed to initialize live streaming. Please try again.');
    }

    // Cleanup on unmount
    return () => {
      if (zegoInstanceRef.current) {
        try {
          zegoInstanceRef.current.destroy();
        } catch (err) {
          console.error('Error destroying ZEGO instance:', err);
        }
        zegoInstanceRef.current = null;
      }
      
      // Clear container DOM
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [kitToken, roomId, isHost]);

  if (sdkError) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{sdkError}</AlertDescription>
      </Alert>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    );
  }

  if (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to load live stream. Please try again.';
    const isConfigError = errorMessage.includes('not configured') || errorMessage.includes('not yet configured');
    
    return (
      <Alert variant={isConfigError ? 'default' : 'destructive'}>
        {isConfigError ? <Info className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
        <AlertTitle>{isConfigError ? 'Configuration Required' : 'Error'}</AlertTitle>
        <AlertDescription>
          {isConfigError 
            ? 'ZEGOCLOUD credentials need to be configured. Please contact the administrator to set up live streaming.'
            : errorMessage}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div 
      ref={containerRef} 
      className="w-full min-h-[400px] rounded-lg overflow-hidden bg-muted"
      style={{ aspectRatio: '16/9' }}
    />
  );
}
