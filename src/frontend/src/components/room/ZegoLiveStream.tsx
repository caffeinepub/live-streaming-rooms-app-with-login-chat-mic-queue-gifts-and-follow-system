import { useEffect, useRef, useState } from 'react';
import { useZegoKitToken } from '@/hooks/useZegoKitToken';
import { useGetCallerUserProfile } from '@/hooks/useCurrentUser';
import { useZegoExpressEngineSdk } from '@/hooks/useZegoExpressEngineSdk';
import { ZEGO_CONFIG, validateZegoConfig } from '@/utils/zegoConfig';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, Info, RefreshCw } from 'lucide-react';

interface ZegoLiveStreamProps {
  roomId: string;
  isHost: boolean;
}

export default function ZegoLiveStream({ roomId, isHost }: ZegoLiveStreamProps) {
  const localVideoRef = useRef<HTMLDivElement>(null);
  const remoteVideoRef = useRef<HTMLDivElement>(null);
  const zegoEngineRef = useRef<any>(null);
  const localStreamRef = useRef<any>(null);
  const [initError, setInitError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  
  const { data: userProfile } = useGetCallerUserProfile();
  const userName = userProfile?.displayName || 'Guest';
  
  const role = isHost ? 'host' : 'audience';
  const { 
    data: tokenData, 
    isLoading: tokenLoading, 
    error: tokenError, 
    refetch: refetchToken 
  } = useZegoKitToken({
    roomId,
    role,
    enabled: true,
  });

  const {
    isReady: sdkReady,
    isLoading: sdkLoading,
    error: sdkError,
    ZegoExpressEngine,
    retry: retrySdk,
  } = useZegoExpressEngineSdk();

  useEffect(() => {
    // Wait for SDK readiness and token
    if (!sdkReady || !ZegoExpressEngine || !tokenData) {
      console.log('[ZEGO Live] Waiting for SDK and token...', {
        sdkReady,
        hasEngine: !!ZegoExpressEngine,
        hasToken: !!tokenData,
      });
      return;
    }

    // Validate configuration
    try {
      validateZegoConfig();
    } catch (err: any) {
      console.error('[ZEGO Live] Configuration error:', err.message);
      setInitError(err.message);
      return;
    }

    console.log('[ZEGO Live] Starting initialization...', {
      roomId,
      role,
      userName,
      appId: ZEGO_CONFIG.appId,
    });

    setIsInitializing(true);
    setInitError(null);

    let engine: any = null;
    let cleanedUp = false;

    const initializeStream = async () => {
      try {
        // Step 1: Create engine instance
        console.log('[ZEGO Live] Step 1: Creating engine instance...');
        engine = new ZegoExpressEngine(ZEGO_CONFIG.appId, ZEGO_CONFIG.server);
        zegoEngineRef.current = engine;

        // Step 2: Set up event listeners
        console.log('[ZEGO Live] Step 2: Setting up event listeners...');
        
        engine.on('roomStreamUpdate', async (roomID: string, updateType: string, streamList: any[]) => {
          console.log('[ZEGO Live] Room stream update:', { roomID, updateType, streamList });
          
          if (updateType === 'ADD' && remoteVideoRef.current) {
            for (const stream of streamList) {
              console.log('[ZEGO Live] Starting to play remote stream:', stream.streamID);
              try {
                const remoteStream = await engine.startPlayingStream(stream.streamID);
                const remoteVideo = document.createElement('video');
                remoteVideo.autoplay = true;
                remoteVideo.playsInline = true;
                remoteVideo.muted = false;
                remoteVideo.style.width = '100%';
                remoteVideo.style.height = '100%';
                remoteVideo.style.objectFit = 'cover';
                remoteVideo.srcObject = remoteStream;
                
                if (remoteVideoRef.current) {
                  remoteVideoRef.current.innerHTML = '';
                  remoteVideoRef.current.appendChild(remoteVideo);
                }
              } catch (err) {
                console.error('[ZEGO Live] Failed to play remote stream:', err);
              }
            }
          } else if (updateType === 'DELETE') {
            console.log('[ZEGO Live] Remote stream removed');
            if (remoteVideoRef.current) {
              remoteVideoRef.current.innerHTML = '';
            }
          }
        });

        engine.on('roomStateUpdate', (roomID: string, state: string, errorCode: number) => {
          console.log('[ZEGO Live] Room state update:', { roomID, state, errorCode });
        });

        // Step 3: Login to room
        console.log('[ZEGO Live] Step 3: Logging into room...');
        const userId = tokenData.userId || `user_${Date.now()}`;
        await engine.loginRoom(roomId, tokenData.token, { userID: userId, userName });
        console.log('[ZEGO Live] ✓ Logged into room successfully');

        // Step 4: If host, create and publish stream
        if (isHost && localVideoRef.current) {
          console.log('[ZEGO Live] Step 4: Creating local stream (host mode)...');
          
          try {
            const localStream = await engine.createStream({
              camera: {
                audio: true,
                video: true,
              },
            });
            localStreamRef.current = localStream;

            const localVideo = document.createElement('video');
            localVideo.autoplay = true;
            localVideo.playsInline = true;
            localVideo.muted = true;
            localVideo.style.width = '100%';
            localVideo.style.height = '100%';
            localVideo.style.objectFit = 'cover';
            localVideo.srcObject = localStream;
            
            if (localVideoRef.current) {
              localVideoRef.current.innerHTML = '';
              localVideoRef.current.appendChild(localVideo);
            }

            console.log('[ZEGO Live] Step 5: Publishing stream...');
            const streamID = `${roomId}_${userId}_main`;
            await engine.startPublishingStream(streamID, localStream);
            console.log('[ZEGO Live] ✓ Stream published successfully:', streamID);
          } catch (err: any) {
            console.error('[ZEGO Live] Failed to create/publish stream:', err);
            throw new Error(`Failed to start streaming: ${err.message}`);
          }
        } else {
          console.log('[ZEGO Live] Audience mode - waiting for host stream...');
        }

        setIsInitializing(false);
        console.log('[ZEGO Live] ✓ Initialization complete');
      } catch (err: any) {
        if (!cleanedUp) {
          console.error('[ZEGO Live] ✗ Initialization failed:', err);
          setInitError(err.message || 'Failed to initialize live stream');
          setIsInitializing(false);
        }
      }
    };

    initializeStream();

    // Cleanup function
    return () => {
      cleanedUp = true;
      console.log('[ZEGO Live] Cleaning up...');

      if (localStreamRef.current) {
        try {
          engine?.destroyStream(localStreamRef.current);
          localStreamRef.current = null;
        } catch (err) {
          console.error('[ZEGO Live] Error destroying local stream:', err);
        }
      }

      if (zegoEngineRef.current) {
        try {
          zegoEngineRef.current.logoutRoom(roomId);
          zegoEngineRef.current = null;
        } catch (err) {
          console.error('[ZEGO Live] Error logging out of room:', err);
        }
      }

      if (localVideoRef.current) {
        localVideoRef.current.innerHTML = '';
      }
      if (remoteVideoRef.current) {
        remoteVideoRef.current.innerHTML = '';
      }

      console.log('[ZEGO Live] ✓ Cleanup complete');
    };
  }, [sdkReady, ZegoExpressEngine, tokenData, roomId, isHost, userName]);

  // SDK loading error
  if (sdkError) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>SDK Loading Error</AlertTitle>
        <AlertDescription className="space-y-2">
          <p>{sdkError.message}</p>
          {sdkError.details && <p className="text-sm">{sdkError.details}</p>}
          <Button 
            variant="outline" 
            size="sm" 
            onClick={retrySdk}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry Loading SDK
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  // Token error
  if (tokenError) {
    const errorMessage = tokenError instanceof Error ? tokenError.message : 'Failed to load live stream token';
    const isConfigError = errorMessage.includes('not configured');
    
    return (
      <Alert variant={isConfigError ? 'default' : 'destructive'}>
        {isConfigError ? <Info className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
        <AlertTitle>{isConfigError ? 'Configuration Required' : 'Token Error'}</AlertTitle>
        <AlertDescription className="space-y-2">
          <p>{errorMessage}</p>
          {!isConfigError && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => refetchToken()}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          )}
        </AlertDescription>
      </Alert>
    );
  }

  // Initialization error
  if (initError) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Initialization Error</AlertTitle>
        <AlertDescription className="space-y-2">
          <p>{initError}</p>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => window.location.reload()}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Page
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  // Loading state
  if (sdkLoading || tokenLoading || isInitializing) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-12 w-full" />
        <p className="text-sm text-muted-foreground text-center">
          {sdkLoading && 'Loading SDK...'}
          {tokenLoading && 'Loading token...'}
          {isInitializing && 'Initializing stream...'}
        </p>
      </div>
    );
  }

  // Render video containers
  return (
    <div className="space-y-4">
      {isHost && (
        <div className="relative w-full rounded-lg overflow-hidden bg-muted" style={{ aspectRatio: '16/9' }}>
          <div ref={localVideoRef} className="w-full h-full" />
          <div className="absolute top-2 left-2 bg-black/50 text-white px-2 py-1 rounded text-xs">
            You (Host)
          </div>
        </div>
      )}
      
      <div className="relative w-full rounded-lg overflow-hidden bg-muted" style={{ aspectRatio: '16/9' }}>
        <div ref={remoteVideoRef} className="w-full h-full flex items-center justify-center">
          <p className="text-muted-foreground text-sm">
            {isHost ? 'Waiting for audience...' : 'Waiting for host to start streaming...'}
          </p>
        </div>
        {!isHost && (
          <div className="absolute top-2 left-2 bg-black/50 text-white px-2 py-1 rounded text-xs">
            Host Stream
          </div>
        )}
      </div>
    </div>
  );
}
