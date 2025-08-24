import axios, { AxiosProgressEvent } from 'axios';

export interface UploadResponse {
  status: "ok" | "error";
  message: string;
  output?: Record<string, unknown>; // n8n feedback data
  reportUrl?: string;
}

export interface UploadProgress {
  percentage: number;
  loaded: number;
  total: number;
}

/**
 * Upload session data to n8n webhook
 * @param formData - FormData containing audio file and drawing JSON
 * @param onProgress - Optional progress callback
 * @returns Promise with upload response
 */


export async function uploadSession(
  formData: FormData,
  onProgress?: (progress: UploadProgress) => void
): Promise<UploadResponse> {
  const webhookUrl = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL ;
  

  if (!webhookUrl) {
    throw new Error("N8N webhook URL not configured");
  }

  try {
    const response = await axios.post(webhookUrl, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: onProgress ? (progressEvent: AxiosProgressEvent) => {
        if (progressEvent.total) {
          const progress: UploadProgress = {
            percentage: Math.round((progressEvent.loaded / progressEvent.total) * 100),
            loaded: progressEvent.loaded,
            total: progressEvent.total
          };
          onProgress(progress);
        }
      } : undefined,
    });

    // Handle successful response - return the actual n8n data
    if (response.status >= 200 && response.status < 300) {
      // If the response has data, include it in the output
      if (response.data && typeof response.data === 'object') {
        return {
          status: "ok",
          message: "Session uploaded successfully",
          output: response.data.output
        } as UploadResponse;
      }
      
      // If response is a string or other format, treat as success
      return {
        status: "ok",
        message: "Session uploaded successfully",
      } as UploadResponse;
    }

    // If status is not in success range
    throw new Error(`Upload failed with status: ${response.status}`);
  } catch (error) {
    console.error("Upload error:", error);
    if (axios.isAxiosError(error)) {
      return {
        status: "error",
        message: error.response?.data?.message || error.message || "Upload failed"
      };
    }
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Upload failed"
    };
  }
}

/**
 * Prepare upload payload for n8n webhook
 * @param audioBlob - Recorded audio blob
 * @param excalidrawJSON - Excalidraw scene data as JSON string
 * @param persona - Duck teacher persona
 * @param topic - Teaching topic
 * @returns FormData ready for upload
 */
export function prepareUploadPayload(
  audioBlob: Blob,
  excalidrawJSON: string,
  persona: string,
  topic: string
): FormData {
  const formData = new FormData();

  // Add audio file with proper naming
  const audioFile = new File([audioBlob], "recording.webm", {
    type: "audio/webm"
  });
  formData.append("audio", audioFile);
  formData.append("audio_fileName", "recording.webm");

  // Add drawing JSON with proper naming
  formData.append("drawing", excalidrawJSON);
  formData.append("drawing_fileName", "drawing.json");

  // Add persona and topic
  formData.append("persona", persona);
  formData.append("topic", topic);

  return formData;
}

/**
 * Get upload payload size information
 */
export function getPayloadInfo(formData: FormData) {
  let totalSize = 0;
  const details: Record<string, { size: number; type: string }> = {};

  for (const [key, value] of formData.entries()) {
    if (value instanceof File) {
      details[key] = {
        size: value.size,
        type: value.type || "unknown"
      };
      totalSize += value.size;
    } else if (typeof value === "string") {
      const size = new Blob([value]).size;
      details[key] = {
        size,
        type: "string"
      };
      totalSize += size;
    }
  }

  return {
    totalSize,
    totalSizeMB: (totalSize / (1024 * 1024)).toFixed(2),
    details
  };
}
