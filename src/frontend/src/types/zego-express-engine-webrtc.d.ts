// Type declarations for ZEGOCLOUD Express Engine WebRTC SDK loaded via CDN

interface ZegoUser {
  userID: string;
  userName: string;
}

interface ZegoStreamConfig {
  camera?: {
    audio?: boolean;
    video?: boolean;
    audioInput?: string;
    videoInput?: string;
  };
  screen?: {
    audio?: boolean;
    video?: boolean;
  };
  custom?: {
    source: MediaStream;
  };
}

interface ZegoPublishConfig {
  videoCodec?: 'H264' | 'VP8' | 'VP9';
}

interface ZegoPlayConfig {
  video?: boolean;
  audio?: boolean;
}

interface ZegoSystemRequirements {
  webRTC: boolean;
  customCapture: boolean;
  camera: boolean;
  microphone: boolean;
  videoCodec: { H264: boolean; VP8: boolean };
  screenSharing: boolean;
}

declare class ZegoExpressEngine {
  constructor(appID: number, server?: string);
  
  // Event handling
  on(event: 'roomStreamUpdate', callback: (roomID: string, updateType: 'ADD' | 'DELETE', streamList: Array<{ streamID: string; user: ZegoUser }>) => void): void;
  on(event: 'roomStateUpdate', callback: (roomID: string, state: 'DISCONNECTED' | 'CONNECTING' | 'CONNECTED', errorCode: number, extendedData: string) => void): void;
  on(event: 'publisherStateUpdate', callback: (result: { streamID: string; state: 'PUBLISHING' | 'NO_PUBLISH' | 'PUBLISH_REQUESTING'; errorCode: number; extendedData: string }) => void): void;
  on(event: 'playerStateUpdate', callback: (result: { streamID: string; state: 'PLAYING' | 'NO_PLAY' | 'PLAY_REQUESTING'; errorCode: number; extendedData: string }) => void): void;
  on(event: string, callback: (...args: any[]) => void): void;
  
  off(event: string, callback?: (...args: any[]) => void): void;
  
  // Room methods
  loginRoom(
    roomID: string,
    token: string,
    user: ZegoUser,
    config?: any
  ): Promise<boolean>;
  
  logoutRoom(roomID: string): Promise<boolean>;
  
  // Stream methods
  createStream(config?: ZegoStreamConfig): Promise<MediaStream>;
  
  destroyStream(stream: MediaStream): void;
  
  startPublishingStream(streamID: string, stream: MediaStream, config?: ZegoPublishConfig): Promise<boolean>;
  
  stopPublishingStream(streamID: string): Promise<boolean>;
  
  startPlayingStream(streamID: string, config?: ZegoPlayConfig): Promise<MediaStream>;
  
  stopPlayingStream(streamID: string): Promise<boolean>;
  
  // Static methods
  static checkSystemRequirements(): Promise<ZegoSystemRequirements>;
  
  static getVersion(): string;
}

// Extend Window interface to include the CDN-loaded SDK
declare global {
  interface Window {
    ZegoExpressEngine: typeof ZegoExpressEngine;
  }
}

export {};
