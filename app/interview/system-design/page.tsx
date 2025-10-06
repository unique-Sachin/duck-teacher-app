"use client";

import { useRef } from "react";
import Script from "next/script";
import { motion } from "framer-motion";
import { Whiteboard, type WhiteboardRef } from "./_components/Whiteboard";
import { SessionNavbar } from "./_components/SessionNavbar";
import { RecorderProvider } from "@/src/context/RecorderContext";

export default function SystemDesignInterviewPage() {
  // Reference to the Whiteboard component
  const whiteboardRef = useRef<WhiteboardRef>(null);

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

        {/* Session Navbar */}
        <SessionNavbar 
          whiteboardRef={whiteboardRef}
          onClearBoard={handleClearWhiteboard}
        />

        {/* Full-screen whiteboard */}
        <div className="h-[calc(100vh-4rem)]">
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
