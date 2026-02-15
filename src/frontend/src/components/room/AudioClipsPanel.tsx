import { useState, useRef } from 'react';
import { useGetAudioClips, useRecordAudioClip, useGetCurrentMicHolder } from '@/hooks/useMic';
import { useUserDisplayName } from '@/hooks/useUserDisplayName';
import { useInternetIdentity } from '@/hooks/useInternetIdentity';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Mic, Square, Play, Pause } from 'lucide-react';
import { toast } from 'sonner';
import type { Principal } from '@dfinity/principal';
import type { AudioClip } from '@/backend';

export default function AudioClipsPanel({ roomId, roomOwnerId }: { roomId: bigint; roomOwnerId: Principal }) {
  const { identity } = useInternetIdentity();
  const { data: clips = [] } = useGetAudioClips(roomId);
  const { data: currentHolder } = useGetCurrentMicHolder(roomId);
  const recordClip = useRecordAudioClip();
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const hasMic = identity && currentHolder && currentHolder.toString() === identity.getPrincipal().toString();

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const arrayBuffer = await blob.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);

        try {
          await recordClip.mutateAsync({ roomId, audioData: uint8Array });
          toast.success('Audio clip posted!');
        } catch (error) {
          toast.error('Failed to post audio clip');
          console.error(error);
        }

        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      toast.info('Recording started...');
    } catch (error) {
      toast.error('Failed to access microphone');
      console.error(error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mic className="h-5 w-5" />
          Audio Clips
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {hasMic && (
          <div className="space-y-2">
            {!isRecording ? (
              <Button onClick={startRecording} className="w-full">
                <Mic className="h-4 w-4 mr-2" />
                Record Clip
              </Button>
            ) : (
              <Button onClick={stopRecording} variant="destructive" className="w-full">
                <Square className="h-4 w-4 mr-2" />
                Stop Recording
              </Button>
            )}
          </div>
        )}

        <ScrollArea className="h-48">
          {clips.length === 0 ? (
            <p className="text-sm text-muted-foreground">No audio clips yet</p>
          ) : (
            <div className="space-y-2">
              {clips.map((clip, idx) => (
                <ClipItem key={idx} clip={clip} />
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

function ClipItem({ clip }: { clip: AudioClip }) {
  const { data: userName } = useUserDisplayName(clip.user);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const togglePlay = () => {
    if (!audioRef.current) {
      // Convert Uint8Array to regular array for Blob constructor
      const dataArray = Array.from(clip.data);
      const blob = new Blob([new Uint8Array(dataArray)], { type: 'audio/webm' });
      const url = URL.createObjectURL(blob);
      audioRef.current = new Audio(url);
      audioRef.current.onended = () => setIsPlaying(false);
    }

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  return (
    <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
      <div className="flex-1">
        <p className="text-sm font-medium">{userName}</p>
        <p className="text-xs text-muted-foreground">
          {new Date(Number(clip.timestamp) / 1000000).toLocaleTimeString()}
        </p>
      </div>
      <Button size="sm" variant="ghost" onClick={togglePlay}>
        {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
      </Button>
    </div>
  );
}
