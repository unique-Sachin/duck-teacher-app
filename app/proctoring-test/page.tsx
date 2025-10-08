'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Video, VideoOff, Camera, AlertCircle, CheckCircle2, Activity, X } from 'lucide-react';
import { toast } from 'sonner';

interface ProctoringMetrics {
  face_detected: boolean;
  face_count: number;
  attention_score: number;
  gaze_direction: string;
  anomalies: Array<{
    type: string;
    message: string;
    severity: 'HIGH' | 'MEDIUM' | 'LOW';
  }>;
}

interface MetricsResponse {
  metrics: ProctoringMetrics;
}

export default function ProctoringTestPage() {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const processedVideoRef = useRef<HTMLVideoElement>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<ProctoringMetrics | null>(null);
  const [violations, setViolations] = useState<Array<{
    type: string;
    message: string;
    severity: string;
    timestamp: string;
  }>>([]);
  
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const metricsIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const API_URL = 'http://localhost:8000';

  // Start camera and WebRTC session
  const startCamera = async () => {
    try {
      setError(null);
      
      // Step 1: Create proctoring session
      toast.info('Creating proctoring session...');
      const sessionResponse = await fetch(`${API_URL}/session/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ max_faces: 2 })
      });
      
      if (!sessionResponse.ok) {
        throw new Error('Failed to create proctoring session');
      }
      
      const { session_id } = await sessionResponse.json();
      setSessionId(session_id);
      toast.success('Session created');
      
      // Step 2: Get camera access
      toast.info('Requesting camera access...');
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = mediaStream;
      }
      
      setStream(mediaStream);
      setIsStreaming(true);
      toast.success('Camera access granted');
      
      // Step 3: Create WebRTC connection
      const pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
      });
      
      peerConnectionRef.current = pc;
      
      // Step 4: Add camera stream
      mediaStream.getTracks().forEach(track => pc.addTrack(track, mediaStream));
      
      // Step 5: Handle processed video from backend
      pc.ontrack = (event) => {
        if (processedVideoRef.current && event.streams[0]) {
          processedVideoRef.current.srcObject = event.streams[0];
          toast.success('Receiving processed video');
        }
      };
      
      // Handle ICE connection state changes
      pc.oniceconnectionstatechange = () => {
        console.log('ICE connection state:', pc.iceConnectionState);
        if (pc.iceConnectionState === 'failed') {
          toast.error('WebRTC connection failed');
        }
      };
      
      // Step 6: Exchange WebRTC offers
      toast.info('Establishing WebRTC connection...');
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      
      const answerResponse = await fetch(`${API_URL}/offer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sdp: pc.localDescription?.sdp,
          type: pc.localDescription?.type,
          session_id: session_id
        })
      });
      
      if (!answerResponse.ok) {
        throw new Error('Failed to exchange WebRTC offer');
      }
      
      const answer = await answerResponse.json();
      await pc.setRemoteDescription(new RTCSessionDescription(answer));
      
      toast.success('WebRTC connection established');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start proctoring';
      setError(errorMessage);
      toast.error(`Error: ${errorMessage}`);
      console.error('Error starting proctoring:', err);
      
      // Cleanup on error
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
        setStream(null);
      }
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
        peerConnectionRef.current = null;
      }
      setIsStreaming(false);
      setSessionId(null);
    }
  };

  // Stop camera and WebRTC session
  const stopCamera = async () => {
    try {
      // Stop metrics polling
      stopMonitoring();
      
      // Close WebRTC connection
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
        peerConnectionRef.current = null;
      }
      
      // Stop camera stream
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = null;
        }
        if (processedVideoRef.current) {
          processedVideoRef.current.srcObject = null;
        }
        setStream(null);
      }
      
      // Stop session on backend
      if (sessionId) {
        const response = await fetch(`${API_URL}/session/stop`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ session_id: sessionId })
        });
        
        if (response.ok) {
          const data = await response.json();
          toast.info(`Session ended. Total anomalies: ${data.summary?.total_anomalies || 0}`);
        }
      }
      
      setIsStreaming(false);
      setSessionId(null);
      setMetrics(null);
      toast.info('Camera stopped');
    } catch (err) {
      console.error('Error stopping camera:', err);
      toast.error('Error stopping session');
    }
  };

  // Start monitoring (poll metrics)
  const startMonitoring = () => {
    if (!sessionId || isMonitoring) return;
    
    setIsMonitoring(true);
    toast.success('Started monitoring violations');
    
    // Poll metrics every 2 seconds
    metricsIntervalRef.current = setInterval(async () => {
      try {
        const response = await fetch(`${API_URL}/metrics?session_id=${sessionId}`);
        
        if (response.ok) {
          const data: MetricsResponse = await response.json();
          setMetrics(data.metrics);
          
          // Handle violations
          if (data.metrics.anomalies && data.metrics.anomalies.length > 0) {
            data.metrics.anomalies.forEach(anomaly => {
              // Add to violations list
              setViolations(prev => [...prev, {
                ...anomaly,
                timestamp: new Date().toISOString()
              }]);
              
              // Show toast based on severity
              const message = `${anomaly.severity}: ${anomaly.message}`;
              if (anomaly.severity === 'HIGH') {
                toast.error(message);
              } else if (anomaly.severity === 'MEDIUM') {
                toast.warning(message);
              } else {
                toast.info(message);
              }
            });
          }
        }
      } catch (err) {
        console.error('Error fetching metrics:', err);
      }
    }, 2000);
  };

  // Stop monitoring
  const stopMonitoring = () => {
    if (metricsIntervalRef.current) {
      clearInterval(metricsIntervalRef.current);
      metricsIntervalRef.current = null;
    }
    setIsMonitoring(false);
    toast.info('Stopped monitoring');
  };

  // Clear violations
  const clearViolations = () => {
    setViolations([]);
    toast.success('Violations cleared');
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }
      if (metricsIntervalRef.current) {
        clearInterval(metricsIntervalRef.current);
      }
    };
  }, [stream]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'HIGH': return 'text-red-600 bg-red-50 border-red-200';
      case 'MEDIUM': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'LOW': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">WebRTC Proctoring System</h1>
        <p className="text-muted-foreground">
          Real-time AI-powered proctoring with MediaPipe and WebRTC
        </p>
        {sessionId && (
          <Badge variant="outline" className="mt-2">
            Session ID: {sessionId.slice(0, 8)}...
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Video Feeds */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="w-5 h-5" />
              Camera Feeds
            </CardTitle>
            <CardDescription>
              Local camera and AI-processed video stream
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Local Video */}
              <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                {!isStreaming && (
                  <div className="absolute inset-0 flex items-center justify-center bg-muted">
                    <div className="text-center">
                      <VideoOff className="w-12 h-12 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">Local Camera</p>
                    </div>
                  </div>
                )}
                {isStreaming && (
                  <div className="absolute top-2 left-2">
                    <Badge variant="outline" className="text-xs">
                      Local
                    </Badge>
                  </div>
                )}
              </div>

              {/* Processed Video */}
              <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
                <video
                  ref={processedVideoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />
                {!isStreaming && (
                  <div className="absolute inset-0 flex items-center justify-center bg-muted">
                    <div className="text-center">
                      <Activity className="w-12 h-12 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">AI Processed</p>
                    </div>
                  </div>
                )}
                {isStreaming && (
                  <div className="absolute top-2 left-2">
                    <Badge variant="destructive" className="animate-pulse text-xs">
                      <div className="w-2 h-2 bg-white rounded-full mr-1" />
                      AI Processing
                    </Badge>
                  </div>
                )}
              </div>
            </div>

            {error && (
              <div className="mt-4 p-4 bg-destructive/10 border border-destructive rounded-lg flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-destructive mt-0.5" />
                <div>
                  <p className="font-semibold text-destructive">Error</p>
                  <p className="text-sm text-muted-foreground">{error}</p>
                </div>
              </div>
            )}

            {/* Controls */}
            <div className="mt-4 flex flex-wrap gap-2">
              {!isStreaming ? (
                <Button onClick={startCamera} className="gap-2">
                  <Video className="w-4 h-4" />
                  Start Proctoring
                </Button>
              ) : (
                <Button onClick={stopCamera} variant="destructive" className="gap-2">
                  <VideoOff className="w-4 h-4" />
                  Stop Proctoring
                </Button>
              )}

              {isStreaming && !isMonitoring && (
                <Button onClick={startMonitoring} variant="default" className="gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  Start Monitoring
                </Button>
              )}

              {isMonitoring && (
                <Button onClick={stopMonitoring} variant="outline" className="gap-2">
                  Stop Monitoring
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Status Panel */}
        <Card>
          <CardHeader>
            <CardTitle>Live Metrics</CardTitle>
            <CardDescription>Real-time proctoring data</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium mb-2">Connection Status</p>
              <Badge variant={isStreaming ? 'default' : 'secondary'}>
                {isStreaming ? 'Connected' : 'Disconnected'}
              </Badge>
            </div>

            <div>
              <p className="text-sm font-medium mb-2">Monitoring Status</p>
              <Badge variant={isMonitoring ? 'default' : 'secondary'}>
                {isMonitoring ? 'Active' : 'Inactive'}
              </Badge>
            </div>

            {metrics && (
              <>
                <div>
                  <p className="text-sm font-medium mb-2">Face Detection</p>
                  <Badge variant={metrics.face_detected ? 'default' : 'destructive'}>
                    {metrics.face_detected ? `${metrics.face_count} face(s)` : 'No face'}
                  </Badge>
                </div>

                <div>
                  <p className="text-sm font-medium mb-2">Attention Score</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary transition-all"
                        style={{ width: `${metrics.attention_score ?? 0}%` }}
                      />
                    </div>
                    <span className="text-sm font-mono">{(metrics.attention_score ?? 0).toFixed(0)}%</span>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium mb-2">Gaze Direction</p>
                  <Badge variant="outline">
                    {metrics.gaze_direction}
                  </Badge>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Violations Panel */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Violations Log</CardTitle>
                <CardDescription>
                  Detected anomalies and suspicious behavior
                </CardDescription>
              </div>
              {violations.length > 0 && (
                <Button onClick={clearViolations} variant="ghost" size="sm">
                  <X className="w-4 h-4 mr-1" />
                  Clear
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {violations.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle2 className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No violations detected</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {violations.map((violation, index) => (
                  <div 
                    key={index}
                    className={`p-3 rounded-lg border ${getSeverityColor(violation.severity)}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-xs">
                            {violation.severity}
                          </Badge>
                          <span className="text-xs font-mono text-muted-foreground">
                            {new Date(violation.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-sm font-medium">{violation.type}</p>
                        <p className="text-xs text-muted-foreground">{violation.message}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* API Integration Info */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>WebRTC Integration</CardTitle>
            <CardDescription>
              Real-time proctoring with MediaPipe backend
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold mb-2">Backend API</h3>
                <code className="block p-3 bg-muted rounded text-sm">
                  {API_URL}
                </code>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Protocol</h3>
                <code className="block p-3 bg-muted rounded text-sm">
                  WebRTC + HTTP
                </code>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Violation Types</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <Badge variant="outline">MULTIPLE_FACES</Badge>
                <Badge variant="outline">NO_FACE_DETECTED</Badge>
                <Badge variant="outline">LOOKING_AWAY</Badge>
                <Badge variant="outline">SUSPICIOUS_HEAD_POSE</Badge>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Features</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>Real-time face detection and tracking</li>
                <li>Gaze direction monitoring</li>
                <li>Multiple person detection</li>
                <li>Attention score calculation</li>
                <li>Low latency (20-50ms) WebRTC streaming</li>
                <li>70% less bandwidth than REST API</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Prerequisites</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>MediaPipe Proctor backend running on <code>localhost:8000</code></li>
                <li>Camera permissions granted</li>
                <li>HTTPS required for production (not localhost)</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
