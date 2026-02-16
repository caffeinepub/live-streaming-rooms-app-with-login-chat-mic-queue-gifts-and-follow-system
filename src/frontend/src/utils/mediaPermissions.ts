/**
 * Request camera and microphone permissions
 * Returns true if granted, false if denied
 */
export async function requestCameraAndMicPermissions(): Promise<{
  granted: boolean;
  error?: string;
}> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });
    
    // Stop all tracks immediately after permission is granted
    stream.getTracks().forEach(track => track.stop());
    
    return { granted: true };
  } catch (error: any) {
    console.error('Media permission error:', error);
    
    if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
      return {
        granted: false,
        error: 'Camera and microphone access denied. Please allow access to start streaming.',
      };
    } else if (error.name === 'NotFoundError') {
      return {
        granted: false,
        error: 'No camera or microphone found. Please connect a device and try again.',
      };
    } else if (error.name === 'NotReadableError') {
      return {
        granted: false,
        error: 'Camera or microphone is already in use by another application.',
      };
    } else {
      return {
        granted: false,
        error: 'Failed to access camera and microphone. Please check your device settings.',
      };
    }
  }
}

/**
 * Check if camera and microphone permissions are already granted
 */
export async function checkMediaPermissions(): Promise<boolean> {
  try {
    if (!navigator.permissions) {
      return false;
    }
    
    const cameraPermission = await navigator.permissions.query({ name: 'camera' as PermissionName });
    const micPermission = await navigator.permissions.query({ name: 'microphone' as PermissionName });
    
    return cameraPermission.state === 'granted' && micPermission.state === 'granted';
  } catch {
    return false;
  }
}
