"use client";

import { useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import EvalyzeLogo from "@/components/evalyze-logo";
import { Send, Trash2, Home } from "lucide-react";
import { toast } from "sonner";
import { NavbarRecorderControls } from "./NavbarRecorderControls";
import { SessionStatus } from "./SessionStatus";
import { useSessionStore } from "@/src/stores/session";
import type { WhiteboardRef } from "./Whiteboard";

interface SessionNavbarProps {
  whiteboardRef: React.RefObject<WhiteboardRef | null>;
  onClearBoard: () => void;
}

export function SessionNavbar({ onClearBoard }: SessionNavbarProps) {
  const [isUploading] = useState(false);
  const [uploadProgress] = useState<number>(0);
  const { data: session } = useSession();

  const { 
    audioBlob,
    hasAudio 
  } = useSessionStore();

  const handleSendToDuck = async () => {
    // Validate audio recording
    if (!audioBlob || !hasAudio()) {
      toast.error("Please record audio", {
        description: "You need to record your explanation before submitting"
      });
      return;
    }

    // Backend services removed - functionality disabled
    toast.error("Upload functionality disabled", {
      description: "Backend services have been removed"
    });
    
    // Uncomment below to enable upload after implementing backend
    /*
    setIsUploading(true);
    setUploadProgress(0);

    try {
      // TODO: Implement upload functionality
      // Export whiteboard, prepare payload, and upload
      
      toast.success("Session uploaded successfully!");
      setTimeout(() => {
        router.push(`/result`);
      }, 1000);

    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Upload failed", {
        description: error instanceof Error ? error.message : "Please try again"
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
    */
  };

  return (
    <header className="border-b bg-background">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center space-x-2">
          <EvalyzeLogo size="sm" />
        </Link>
        
        <div className="flex items-center space-x-4">
          {/* Session Info */}
          <div className="hidden md:flex items-center space-x-2 text-sm text-muted-foreground">
            <span>{session?.user?.email || 'User'}</span>
            <Separator orientation="vertical" className="h-4" />
            <span>System Design Interview</span>
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

          {/* Send to Evalyze Button */}
          <Button 
            className="flex items-center gap-2" 
            size="sm"
            disabled={!hasAudio() || isUploading}
            onClick={handleSendToDuck}
          >
            <Send className="w-4 h-4" />
            {isUploading 
              ? `Uploading${uploadProgress ? ` ${uploadProgress}%` : '...'}` 
              : 'Send to Evalyze 🦆'
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
