/**
 * Utility functions for proctoring system
 * Helper functions for image processing, compression, and validation
 */

/**
 * Compress base64 image to reduce payload size
 * @param base64Image - Base64 encoded image string
 * @param quality - JPEG quality (0-1), default 0.7
 * @returns Compressed base64 image
 */
export async function compressImage(
  base64Image: string,
  quality: number = 0.7
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }

      // Set canvas size
      canvas.width = img.width;
      canvas.height = img.height;

      // Draw and compress
      ctx.drawImage(img, 0, 0);
      const compressed = canvas.toDataURL('image/jpeg', quality);
      resolve(compressed);
    };
    img.onerror = reject;
    img.src = base64Image;
  });
}

/**
 * Resize image to max dimensions while maintaining aspect ratio
 * @param base64Image - Base64 encoded image string
 * @param maxWidth - Maximum width in pixels
 * @param maxHeight - Maximum height in pixels
 * @returns Resized base64 image
 */
export async function resizeImage(
  base64Image: string,
  maxWidth: number = 1280,
  maxHeight: number = 720
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }

      // Calculate new dimensions
      let { width, height } = img;
      
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }
      
      if (height > maxHeight) {
        width = (width * maxHeight) / height;
        height = maxHeight;
      }

      // Set canvas size and draw
      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, 0, 0, width, height);
      
      const resized = canvas.toDataURL('image/jpeg', 0.8);
      resolve(resized);
    };
    img.onerror = reject;
    img.src = base64Image;
  });
}

/**
 * Get image dimensions from base64 string
 * @param base64Image - Base64 encoded image string
 * @returns Object with width and height
 */
export async function getImageDimensions(
  base64Image: string
): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.width, height: img.height });
    };
    img.onerror = reject;
    img.src = base64Image;
  });
}

/**
 * Calculate base64 image size in bytes
 * @param base64Image - Base64 encoded image string
 * @returns Size in bytes
 */
export function getImageSize(base64Image: string): number {
  const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, '');
  const padding = (base64Data.match(/=/g) || []).length;
  return (base64Data.length * 3) / 4 - padding;
}

/**
 * Format bytes to human readable string
 * @param bytes - Number of bytes
 * @returns Formatted string (e.g., "1.5 MB")
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Validate if string is a valid base64 image
 * @param base64Image - String to validate
 * @returns Boolean indicating validity
 */
export function isValidBase64Image(base64Image: string): boolean {
  try {
    if (!base64Image || typeof base64Image !== 'string') {
      return false;
    }
    
    // Check if it has the data URL prefix
    const hasPrefix = /^data:image\/(png|jpeg|jpg|gif|webp);base64,/.test(base64Image);
    if (!hasPrefix) {
      return false;
    }
    
    // Check if the base64 part is valid
    const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, '');
    const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
    return base64Regex.test(base64Data);
  } catch {
    return false;
  }
}

/**
 * Extract metadata from base64 image
 * @param base64Image - Base64 encoded image string
 * @returns Metadata object
 */
export async function getImageMetadata(base64Image: string) {
  const dimensions = await getImageDimensions(base64Image);
  const size = getImageSize(base64Image);
  const mimeType = base64Image.split(';')[0].split(':')[1];
  
  return {
    width: dimensions.width,
    height: dimensions.height,
    size,
    sizeFormatted: formatBytes(size),
    mimeType,
    aspectRatio: (dimensions.width / dimensions.height).toFixed(2),
  };
}

/**
 * Batch process multiple frames
 * Useful for analyzing multiple frames at once
 * @param frames - Array of base64 image strings
 * @param apiEndpoint - API endpoint to send frames to
 * @returns Array of analysis results
 */
export async function batchAnalyzeFrames(
  frames: string[],
  apiEndpoint: string = '/api/proctoring/analyze'
): Promise<unknown[]> {
  const promises = frames.map(async (frame) => {
    const response = await fetch(apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image: frame,
        timestamp: new Date().toISOString(),
      }),
    });
    return response.json();
  });
  
  return Promise.all(promises);
}

/**
 * Create thumbnail from base64 image
 * @param base64Image - Base64 encoded image string
 * @param thumbnailSize - Thumbnail dimension (square)
 * @returns Base64 encoded thumbnail
 */
export async function createThumbnail(
  base64Image: string,
  thumbnailSize: number = 150
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }

      canvas.width = thumbnailSize;
      canvas.height = thumbnailSize;

      // Calculate crop dimensions for square thumbnail
      const size = Math.min(img.width, img.height);
      const x = (img.width - size) / 2;
      const y = (img.height - size) / 2;

      ctx.drawImage(
        img,
        x, y, size, size,
        0, 0, thumbnailSize, thumbnailSize
      );
      
      const thumbnail = canvas.toDataURL('image/jpeg', 0.7);
      resolve(thumbnail);
    };
    img.onerror = reject;
    img.src = base64Image;
  });
}

/**
 * Camera device utilities
 */
export const cameraUtils = {
  /**
   * Get list of available camera devices
   * @returns Array of camera devices
   */
  async getDevices(): Promise<MediaDeviceInfo[]> {
    const devices = await navigator.mediaDevices.enumerateDevices();
    return devices.filter(device => device.kind === 'videoinput');
  },

  /**
   * Check if user has granted camera permission
   * @returns Boolean indicating permission status
   */
  async hasPermission(): Promise<boolean> {
    try {
      const result = await navigator.permissions.query({ name: 'camera' as PermissionName });
      return result.state === 'granted';
    } catch {
      // Fallback: try to get devices (will be empty labels if no permission)
      const devices = await this.getDevices();
      return devices.length > 0 && devices[0].label !== '';
    }
  },

  /**
   * Get optimal camera constraints for proctoring
   * @returns MediaStreamConstraints
   */
  getOptimalConstraints(): MediaStreamConstraints {
    return {
      video: {
        width: { ideal: 1280, min: 640 },
        height: { ideal: 720, min: 480 },
        frameRate: { ideal: 30, max: 30 },
        facingMode: 'user',
      },
      audio: false,
    };
  },
};
