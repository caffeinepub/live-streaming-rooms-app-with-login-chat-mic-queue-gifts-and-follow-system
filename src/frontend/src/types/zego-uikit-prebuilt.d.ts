declare global {
  interface Window {
    ZegoUIKitPrebuilt?: {
      generateKitTokenForTest(
        appID: number,
        serverSecret: string,
        roomID: string,
        userID: string,
        userName: string
      ): string;
      create(kitToken: string): ZegoUIKitPrebuiltInstance;
      GroupCall: number;
      LiveStreaming: number;
      Host: number;
      Cohost: number;
      Audience: number;
    };
  }
}

interface ZegoUIKitPrebuiltInstance {
  joinRoom(config: {
    container: HTMLElement | null;
    scenario: {
      mode: number;
      config?: {
        role?: number;
      };
    };
    showPreJoinView?: boolean;
    turnOnCameraWhenJoining?: boolean;
    turnOnMicrophoneWhenJoining?: boolean;
    showMyCameraToggleButton?: boolean;
    showMyMicrophoneToggleButton?: boolean;
    showAudioVideoSettingsButton?: boolean;
    showScreenSharingButton?: boolean;
    showTextChat?: boolean;
    showUserList?: boolean;
    maxUsers?: number;
    layout?: string;
    showLayoutButton?: boolean;
  }): void;
  destroy(): void;
}

export {};
