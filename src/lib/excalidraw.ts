// Define basic types for Excalidraw data
export interface ExcalidrawElement {
  id: string;
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  angle: number;
  strokeColor: string;
  backgroundColor: string;
  fillStyle: string;
  strokeWidth: number;
  strokeStyle: string;
  roughness: number;
  opacity: number;
  [key: string]: unknown;
}

export interface ExcalidrawAppState {
  viewBackgroundColor?: string;
  gridSize?: number;
  theme?: string;
  zoom?: { value: number };
  scrollX?: number;
  scrollY?: number;
  width?: number;
  height?: number;
  [key: string]: unknown;
}

export interface ExcalidrawFiles {
  [fileId: string]: {
    id: string;
    dataURL: string;
    mimeType: string;
    created: number;
    [key: string]: unknown;
  };
}

export interface ExcalidrawSceneData {
  elements: readonly ExcalidrawElement[];
  appState: ExcalidrawAppState;
  files: ExcalidrawFiles;
}

// Define a generic API reference interface
export interface ExcalidrawAPIRef {
  getSceneElements: () => readonly ExcalidrawElement[];
  getAppState: () => ExcalidrawAppState;
  getFiles: () => ExcalidrawFiles;
}

/**
 * Export the current Excalidraw scene data
 * @param apiRef - Reference to the Excalidraw imperative API
 * @returns Scene data containing elements, appState, and files
 */
export function exportScene(apiRef: ExcalidrawAPIRef | null): ExcalidrawSceneData | null {
  if (!apiRef) {
    console.warn("Excalidraw API reference is null");
    return null;
  }

  try {
    const elements = apiRef.getSceneElements();
    const appState = apiRef.getAppState();
    const files = apiRef.getFiles();

    const sceneData: ExcalidrawSceneData = {
      elements,
      appState: {
        // Only include essential app state properties to reduce payload size
        viewBackgroundColor: appState.viewBackgroundColor,
        gridSize: appState.gridSize,
        theme: appState.theme,
        zoom: appState.zoom,
        scrollX: appState.scrollX,
        scrollY: appState.scrollY,
        width: appState.width,
        height: appState.height,
      },
      files,
    };

    return sceneData;
  } catch (error) {
    console.error("Error exporting Excalidraw scene:", error);
    return null;
  }
}

/**
 * Safely serialize scene data to JSON string
 * @param sceneData - The scene data to serialize
 * @returns JSON string or null if serialization fails
 */
export function serializeScene(sceneData: ExcalidrawSceneData | null): string | null {
  if (!sceneData) {
    return null;
  }

  try {
    return JSON.stringify(sceneData, null, 0); // Compact JSON without indentation
  } catch (error) {
    console.error("Error serializing scene data:", error);
    return null;
  }
}

/**
 * Get the size of the serialized scene data in bytes
 * @param jsonString - The JSON string to measure
 * @returns Size in bytes
 */
export function getSceneDataSize(jsonString: string | null): number {
  if (!jsonString) return 0;
  return new Blob([jsonString]).size;
}

/**
 * Export and serialize scene data in one step
 * @param apiRef - Reference to the Excalidraw imperative API
 * @returns Object with JSON string and metadata
 */
export function exportAndSerializeScene(apiRef: ExcalidrawAPIRef | null) {
  const sceneData = exportScene(apiRef);
  const jsonString = serializeScene(sceneData);
  const sizeBytes = getSceneDataSize(jsonString);

  return {
    sceneData,
    jsonString,
    sizeBytes,
    sizeMB: sizeBytes / (1024 * 1024),
    elementCount: sceneData?.elements?.length || 0,
  };
}
