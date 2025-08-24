"use client";

import { useState, useImperativeHandle, forwardRef } from "react";
import dynamic from "next/dynamic";
import "@excalidraw/excalidraw/index.css";

// Dynamic import to prevent SSR issues (official Next.js integration method)
const Excalidraw = dynamic(
  async () => (await import("@excalidraw/excalidraw")).Excalidraw,
  { ssr: false }
);

interface WhiteboardProps {
  className?: string;
}

export interface WhiteboardRef {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getSceneElements: () => any[] | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getAppState: () => any | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getFiles: () => any | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  exportScene: () => { elements: any[]; appState: any; files: any } | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  updateScene: (sceneData: any) => void;
  resetScene: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getAPIRef: () => any | null;
}

export const Whiteboard = forwardRef<WhiteboardRef, WhiteboardProps>(
  ({ className = "" }, ref) => {
    // Store the Excalidraw API reference using official method
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [excalidrawAPI, setExcalidrawAPI] = useState<any>(null);

    // Handle when Excalidraw API is ready (official callback method)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleExcalidrawAPI = (api: any) => {
      setExcalidrawAPI(api);
    };

    // Expose methods to parent component
    useImperativeHandle(ref, () => ({
      getSceneElements: () => {
        return excalidrawAPI?.getSceneElements() || null;
      },
      getAppState: () => {
        return excalidrawAPI?.getAppState() || null;
      },
      getFiles: () => {
        return excalidrawAPI?.getFiles() || null;
      },
      exportScene: () => {
        if (excalidrawAPI) {
          const elements = excalidrawAPI.getSceneElements();
          const appState = excalidrawAPI.getAppState();
          const files = excalidrawAPI.getFiles();
          return { elements, appState, files };
        }
        return null;
      },
      updateScene: (sceneData) => {
        if (excalidrawAPI) {
          excalidrawAPI.updateScene(sceneData);
        }
      },
      resetScene: () => {
        if (excalidrawAPI) {
          excalidrawAPI.resetScene();
        }
      },
      getAPIRef: () => {
        return excalidrawAPI;
      },
    }));

    return (
      <div 
        className={`${className}`} 
        style={{ 
          height: '100%', 
          width: '100%',
          position: 'relative'
        }}
      >
        <Excalidraw
          excalidrawAPI={handleExcalidrawAPI}
          initialData={{
            elements: [],
            appState: {
              viewBackgroundColor: "#ffffff",
              theme: "light",
            },
          }}
          UIOptions={{
            canvasActions: {
              loadScene: false,
              saveToActiveFile: false,
              saveAsImage: true,
              clearCanvas: true,
              export: {
                saveFileToDisk: false,
              },
            },
            tools: {
              image: false,
            },
          }}
        />
      </div>
    );
  }
);

Whiteboard.displayName = "Whiteboard";

// Export the function for external use
export { Whiteboard as default };
