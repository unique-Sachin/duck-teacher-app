"use client";

import { useState, useRef, useEffect } from "react";
import Script from "next/script";
import { motion } from "framer-motion";
import { Whiteboard, type WhiteboardRef } from "./_components/Whiteboard";
import { InitialSetupModal } from "./_components/InitialSetupModal";
import { SessionNavbar } from "./_components/SessionNavbar";
import { RecorderProvider } from "@/src/context/RecorderContext";
import { useSessionStore } from "@/src/stores/session";

export default function SessionPage() {
  const [isSetupModalOpen, setIsSetupModalOpen] = useState(true);
  const [hasCompletedSetup, setHasCompletedSetup] = useState(false);
  
  // Zustand store
  const { email, persona, topic } = useSessionStore();

  // Reference to the Whiteboard component
  const whiteboardRef = useRef<WhiteboardRef>(null);

  // Check if user has already set up email, persona, and topic
  useEffect(() => {
    if (email && persona && topic) {
      setHasCompletedSetup(true);
      setIsSetupModalOpen(false);
    }
  }, [email, persona, topic]);

  const handleSetupComplete = () => {
    setHasCompletedSetup(true);
    setIsSetupModalOpen(false);
  };

  const handleClearWhiteboard = () => {
    whiteboardRef.current?.resetScene();
  };

  return (
    <RecorderProvider>
      <div className="min-h-screen bg-background">
        {/* Load Excalidraw environment variables */}
        <Script id="load-env-variables" strategy="beforeInteractive">
          {`window["EXCALIDRAW_ASSET_PATH"] = location.origin;`}
        </Script>

        {/* Initial Setup Modal */}
        <InitialSetupModal 
          isOpen={isSetupModalOpen} 
          onComplete={handleSetupComplete}
        />

        {/* Session Navbar - only show after setup */}
        {hasCompletedSetup && (
          <SessionNavbar 
            whiteboardRef={whiteboardRef}
            onClearBoard={handleClearWhiteboard}
          />
        )}

        {/* Full-screen whiteboard */}
        <div className={hasCompletedSetup ? "h-[calc(100vh-4rem)]" : "h-screen"}>
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="h-full w-full bg-card relative"
          >
            <Whiteboard ref={whiteboardRef} />
          </motion.div>
        </div>
      </div>
    </RecorderProvider>
  );
}
