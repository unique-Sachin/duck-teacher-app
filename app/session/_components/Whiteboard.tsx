"use client";

import { useState, useImperativeHandle, forwardRef } from "react";
import { useTheme } from "next-themes";
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
  // New image export function
  exportAsImage: (type?: 'png' | 'jpeg', quality?: number) => Promise<Blob | null>;
}

export const Whiteboard = forwardRef<WhiteboardRef, WhiteboardProps>(
  ({ className = "" }, ref) => {
    const { theme } = useTheme();
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
      exportAsImage: async (type = 'png', quality = 1.0) => {
        if (!excalidrawAPI) {
          console.warn("Excalidraw API not available for image export");
          return null;
        }
        
        try {
          // Dynamic import to get the export function
          const { exportToBlob } = await import("@excalidraw/excalidraw");
          
          const elements = excalidrawAPI.getSceneElements();
          const appState = excalidrawAPI.getAppState();
          const files = excalidrawAPI.getFiles();
          
          // Export as image blob
          const blob = await exportToBlob({
            elements,
            appState: {
              ...appState,
              exportBackground: true,
              exportWithDarkMode: appState.theme === 'dark',
            },
            files,
            mimeType: type === 'jpeg' ? 'image/jpeg' : 'image/png',
            quality: type === 'jpeg' ? quality : undefined,
          });
          
          return blob;
        } catch (error) {
          console.error("Error exporting whiteboard as image:", error);
          return null;
        }
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
              theme: theme === "light" ? "light" : "dark",
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
