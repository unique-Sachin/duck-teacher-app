"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Send, Trash2, Home } from "lucide-react";
import { toast } from "sonner";
import { NavbarRecorderControls } from "./NavbarRecorderControls";
import { SessionStatus } from "./SessionStatus";
import { useSessionStore } from "@/src/stores/session";
import { exportAsImageBlob } from "@/src/lib/excalidraw";
import { uploadSession, prepareUploadPayload, getPayloadInfo, type UploadProgress } from "@/src/lib/uploader";
import type { WhiteboardRef } from "./Whiteboard";
import { useRouter } from "next/navigation";

interface SessionNavbarProps {
  whiteboardRef: React.RefObject<WhiteboardRef | null>;
  onClearBoard: () => void;
}

export function SessionNavbar({ whiteboardRef, onClearBoard }: SessionNavbarProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
  const router = useRouter();

  const { 
    email, 
    persona, 
    topic,
    audioBlob,
    setExcalidrawJSON,
    setUploadResponse,
    isFormValid,
    hasEmail,
    hasAudio 
  } = useSessionStore();

  const handleSendToDuck = async () => {
    // Validate form before sending
    if (!isFormValid()) {
      toast.error("Please complete all required fields", {
        description: `Missing: ${!hasEmail() ? 'email' : ''} ${!hasAudio() ? 'audio recording' : ''}`.trim()
      });
      return;
    }

    if (!audioBlob) {
      toast.error("No audio recording found");
      return;
    }

    setIsUploading(true);
    setUploadProgress(null);

    try {
      // Export the whiteboard as an image instead of JSON
      const apiRef = whiteboardRef.current?.getAPIRef();
      const exportResult = await exportAsImageBlob(apiRef, {
        type: 'png',
        quality: 0.95,
        scale: 2 // Higher resolution for better LLM analysis
      });
      
      if (!exportResult) {
        toast.error("Failed to export whiteboard image");
        setIsUploading(false);
        return;
      }

      // Save whiteboard data to store (keeping for backward compatibility, but storing image info)
      setExcalidrawJSON(JSON.stringify({
        hasContent: exportResult.hasContent,
        elementCount: exportResult.elementCount,
        sizeBytes: exportResult.sizeBytes,
        mimeType: exportResult.mimeType
      }));

      // Prepare upload payload with image blob
      const formData = prepareUploadPayload(audioBlob, exportResult.blob, persona, topic);
      
      // Get payload info for logging
      const payloadInfo = getPayloadInfo(formData);

      // Show upload toast with progress
      const uploadToastId = toast.loading("Uploading session to Duck Teacher...", {
        description: `Uploading ${payloadInfo.totalSizeMB} MB`
      });

      // Upload with progress tracking
      const result = await uploadSession(formData, (progress: UploadProgress) => {
        setUploadProgress(progress);
        toast.loading(`Uploading session... ${progress.percentage}%`, {
          id: uploadToastId,
          description: `${(progress.loaded / (1024 * 1024)).toFixed(1)} MB / ${(progress.total / (1024 * 1024)).toFixed(1)} MB`
        });
      });

      // Handle upload result
      if (result.status === "ok") {
        // Store the response for the result page
        setUploadResponse(result);
        
        toast.success("Session uploaded successfully!", {
          id: uploadToastId,
          description: result.message || "Your session has been sent to Duck Teacher"
        });
        // Add a small delay to let the toast show, then navigate
        setTimeout(() => {
          router.push(`/result`);
        }, 1000);
      } else {
        toast.error("Upload failed", {
          id: uploadToastId,
          description: result.message || "Please try again"
        });
      }

    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Upload failed", {
        description: error instanceof Error ? error.message : "Please try again"
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(null);
    }
  };

  return (
    <header className="border-b bg-background">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center space-x-2">
          <span className="text-2xl">🦆</span>
          <span className="font-bold text-xl">Duck Teacher</span>
        </Link>
        
        <div className="flex items-center space-x-4">
          {/* Session Info */}
          <div className="hidden md:flex items-center space-x-2 text-sm text-muted-foreground">
            <span>{email}</span>
            <Separator orientation="vertical" className="h-4" />
            <span className="capitalize">{persona} Duck</span>
          </div>

          {/* Recording Controls */}
          <NavbarRecorderControls />
          
          {/* Session Status */}
          <SessionStatus />

          {/* Clear Board Button */}
          <Button 
            variant="outline" 
            size="sm"
            onClick={onClearBoard}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Clear
          </Button>

          {/* Send to Duck Button */}
          <Button 
            className="flex items-center gap-2" 
            size="sm"
            disabled={!isFormValid() || isUploading}
            onClick={handleSendToDuck}
          >
            <Send className="w-4 h-4" />
            {isUploading 
              ? `Uploading${uploadProgress ? ` ${uploadProgress.percentage}%` : '...'}` 
              : 'Send to Duck 🦆'
            }
          </Button>

          {/* Home/Exit Button */}
          <Button variant="outline" size="sm" asChild>
            <Link href="/">
              <Home className="w-4 h-4 mr-2" />
              Home
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
