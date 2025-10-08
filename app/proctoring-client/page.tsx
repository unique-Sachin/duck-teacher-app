'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Video, 
  VideoOff, 
  Camera, 
  AlertCircle, 
  CheckCircle2, 
  Activity, 
  X,
  Eye,
  Users,
  Clock,
  Shield,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';
import { useMediaPipeProctoring, ProctoringEvent } from '@/src/hooks/useMediaPipeProctoring';

export default function ClientSideProctoringPage() {
  const [events, setEvents] = useState<ProctoringEvent[]>([]);
  
  const proctoring = useMediaPipeProctoring({
    onEvent: (event) => {
      // Add new event to the list
      setEvents(prev => [event, ...prev].slice(0, 50)); // Keep last 50 events
      
      // Show toast notification for violations
      if (event.type !== 'face_detected') {
        const message = `${event.severity}: ${event.message}`;
        if (event.severity === 'HIGH') {
          toast.error(message, { duration: 3000 });
        } else if (event.severity === 'MEDIUM') {
          toast.warning(message, { duration: 2000 });
        }
      }
    },
    enableLogging: true,
    detectionInterval: 200 // Check every 200ms (5 FPS)
  });

  const handleStart = async () => {
    const success = await proctoring.start();
    if (success) {
      toast.success('Proctoring started successfully');
    } else {
      toast.error('Failed to start proctoring');
    }
  };

  const handleStop = () => {
    proctoring.stop();
    toast.info('Proctoring stopped');
  };

  const handleClearEvents = () => {
    setEvents([]);
    proctoring.clearEvents();
    toast.success('Events cleared');
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'HIGH': return 'text-red-600 bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800';
      case 'MEDIUM': return 'text-yellow-600 bg-yellow-50 border-yellow-200 dark:bg-yellow-950 dark:border-yellow-800';
      case 'LOW': return 'text-blue-600 bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800';
      default: return 'text-gray-600 bg-gray-50 border-gray-200 dark:bg-gray-950 dark:border-gray-800';
    }
  };

  const getSeverityBadgeVariant = (severity: string) => {
    switch (severity) {
      case 'HIGH': return 'destructive';
      case 'MEDIUM': return 'default';
      case 'LOW': return 'secondary';
      default: return 'outline';
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getGazeIcon = (direction: string) => {
    switch (direction) {
      case 'center': return '👁️';
      case 'left': return '👈';
      case 'right': return '👉';
      case 'up': return '👆';
      case 'down': return '👇';
      default: return '❓';
    }
  };

  const getIntegrityColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          <Shield className="w-8 h-8" />
          Client-Side AI Proctoring
        </h1>
        <p className="text-muted-foreground">
          Real-time MediaPipe face detection - 100% client-side, no backend required
        </p>
        <div className="flex gap-2 mt-3">
          <Badge variant="outline" className="gap-1">
            <Activity className="w-3 h-3" />
            MediaPipe Vision
          </Badge>
          <Badge variant="outline" className="gap-1">
            <Camera className="w-3 h-3" />
            Client-Side Processing
          </Badge>
          <Badge variant="outline" className="gap-1">
            <Shield className="w-3 h-3" />
            Privacy-First
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Video Feed */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="w-5 h-5" />
              Camera Feed & Face Detection
            </CardTitle>
            <CardDescription>
              Live video with MediaPipe face landmarks overlay
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Video Display */}
            <div className="relative bg-black rounded-lg overflow-hidden aspect-video mb-4">
              {proctoring.stream ? (
                <>
                  <video
                    ref={(el) => {
                      if (el && proctoring.stream) {
                        el.srcObject = proctoring.stream;
                      }
                    }}
                    autoPlay
                    playsInline
                    muted
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <canvas
                    ref={proctoring.canvasRef}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                </>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-muted">
                  <div className="text-center">
                    <VideoOff className="w-12 h-12 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Camera Off</p>
                    {!proctoring.isInitialized && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Click &quot;Start Proctoring&quot; to begin
                      </p>
                    )}
                  </div>
                </div>
              )}
              
              {proctoring.isActive && (
                <>
                  <div className="absolute top-3 left-3">
                    <Badge variant="destructive" className="animate-pulse text-xs gap-1">
                      <div className="w-2 h-2 bg-white rounded-full" />
                      LIVE
                    </Badge>
                  </div>
                  
                  {/* Live Status Overlay */}
                  <div className="absolute bottom-3 left-3 right-3 bg-black/70 backdrop-blur-sm rounded-lg p-3 text-white">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                      <div>
                        <div className="text-gray-400 mb-1">Face Status</div>
                        <div className="font-semibold">
                          {proctoring.metrics.faceDetected ? (
                            <span className="text-green-400">✓ Detected ({proctoring.metrics.faceCount})</span>
                          ) : (
                            <span className="text-red-400">✗ Not Found</span>
                          )}
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-400 mb-1">Gaze</div>
                        <div className="font-semibold">
                          {getGazeIcon(proctoring.metrics.gazeDirection)} {proctoring.metrics.gazeDirection}
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-400 mb-1">Attention</div>
                        <div className="font-semibold">{proctoring.metrics.attentionScore.toFixed(0)}%</div>
                      </div>
                      <div>
                        <div className="text-gray-400 mb-1">Distance</div>
                        <div className="font-semibold capitalize">{proctoring.metrics.faceDistance}</div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Error Display */}
            {proctoring.error && (
              <div className="mb-4 p-4 bg-destructive/10 border border-destructive rounded-lg flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-destructive mt-0.5" />
                <div>
                  <p className="font-semibold text-destructive">Error</p>
                  <p className="text-sm text-muted-foreground">{proctoring.error}</p>
                </div>
              </div>
            )}

            {/* Controls */}
            <div className="flex flex-wrap gap-2">
              {!proctoring.isActive ? (
                <Button onClick={handleStart} className="gap-2">
                  <Video className="w-4 h-4" />
                  Start Proctoring
                </Button>
              ) : (
                <Button onClick={handleStop} variant="destructive" className="gap-2">
                  <VideoOff className="w-4 h-4" />
                  Stop Proctoring
                </Button>
              )}
              
              {!proctoring.isInitialized && !proctoring.isActive && (
                <Badge variant="outline" className="gap-1">
                  <AlertCircle className="w-3 h-3" />
                  MediaPipe not initialized
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Live Metrics Panel */}
        <div className="space-y-6">
          {/* Session Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Session Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    Duration
                  </span>
                  <span className="text-sm font-mono font-bold">
                    {formatDuration(proctoring.stats.sessionDuration)}
                  </span>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium flex items-center gap-1">
                    <Shield className="w-4 h-4" />
                    Integrity Score
                  </span>
                  <span className={`text-lg font-bold ${getIntegrityColor(proctoring.stats.integrityScore)}`}>
                    {proctoring.stats.integrityScore.toFixed(0)}%
                  </span>
                </div>
                <Progress value={proctoring.stats.integrityScore} className="h-2" />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium flex items-center gap-1">
                    <Eye className="w-4 h-4" />
                    Avg. Attention
                  </span>
                  <span className="text-sm font-mono font-bold">
                    {proctoring.stats.averageAttentionScore.toFixed(0)}%
                  </span>
                </div>
                <Progress value={proctoring.stats.averageAttentionScore} className="h-2" />
              </div>

              <div className="pt-2 border-t">
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <div className="text-muted-foreground mb-1">Total Violations</div>
                    <div className="text-lg font-bold">{proctoring.stats.totalViolations}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground mb-1">Looking Away</div>
                    <div className="text-lg font-bold">{proctoring.stats.lookingAwayCount}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground mb-1">Multiple Faces</div>
                    <div className="text-lg font-bold">{proctoring.stats.multipleFacesCount}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground mb-1">No Face (s)</div>
                    <div className="text-lg font-bold">{proctoring.stats.noFaceDetectedDuration.toFixed(0)}</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Live Metrics */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Live Metrics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Face Detected</span>
                <Badge variant={proctoring.metrics.faceDetected ? 'default' : 'destructive'}>
                  {proctoring.metrics.faceDetected ? '✓ Yes' : '✗ No'}
                </Badge>
              </div>

              <div className="flex justify-between">
                <span className="text-muted-foreground">Face Count</span>
                <Badge variant="outline">
                  <Users className="w-3 h-3 mr-1" />
                  {proctoring.metrics.faceCount}
                </Badge>
              </div>

              <div className="flex justify-between">
                <span className="text-muted-foreground">Gaze Direction</span>
                <Badge variant="outline">
                  {getGazeIcon(proctoring.metrics.gazeDirection)} {proctoring.metrics.gazeDirection}
                </Badge>
              </div>

              <div className="flex justify-between">
                <span className="text-muted-foreground">Face Distance</span>
                <Badge variant="outline" className="capitalize">
                  {proctoring.metrics.faceDistance}
                </Badge>
              </div>

              <div className="flex justify-between">
                <span className="text-muted-foreground">Lighting</span>
                <Badge variant="outline" className="capitalize">
                  {proctoring.metrics.lightingQuality}
                </Badge>
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-muted-foreground">Head Pose</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="bg-muted p-2 rounded text-center">
                    <div className="text-muted-foreground">Pitch</div>
                    <div className="font-mono font-bold">{proctoring.metrics.headPose.pitch.toFixed(0)}°</div>
                  </div>
                  <div className="bg-muted p-2 rounded text-center">
                    <div className="text-muted-foreground">Yaw</div>
                    <div className="font-mono font-bold">{proctoring.metrics.headPose.yaw.toFixed(0)}°</div>
                  </div>
                  <div className="bg-muted p-2 rounded text-center">
                    <div className="text-muted-foreground">Roll</div>
                    <div className="font-mono font-bold">{proctoring.metrics.headPose.roll.toFixed(0)}°</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Violations Log */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  Violations Log
                </CardTitle>
                <CardDescription>
                  Real-time detection of proctoring violations
                </CardDescription>
              </div>
              {events.length > 0 && (
                <Button onClick={handleClearEvents} variant="ghost" size="sm">
                  <X className="w-4 h-4 mr-1" />
                  Clear
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {events.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <CheckCircle2 className="w-16 h-16 mx-auto mb-3 opacity-50" />
                <p className="text-lg font-medium">No violations detected</p>
                <p className="text-sm">All systems normal</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {events.map((event, index) => (
                  <div 
                    key={`${event.timestamp.getTime()}-${index}`}
                    className={`p-3 rounded-lg border ${getSeverityColor(event.severity)}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <Badge variant={getSeverityBadgeVariant(event.severity) as "default" | "destructive" | "secondary"} className="text-xs">
                            {event.severity}
                          </Badge>
                          <span className="text-xs font-mono text-muted-foreground">
                            {event.timestamp.toLocaleTimeString()}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            Confidence: {(event.confidence * 100).toFixed(0)}%
                          </span>
                        </div>
                        <p className="text-sm font-semibold capitalize">
                          {event.type.replace(/_/g, ' ')}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">{event.message}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Features Info */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Features & Capabilities
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  Detection Capabilities
                </h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>✓ Face presence detection</li>
                  <li>✓ Multiple person detection</li>
                  <li>✓ Gaze direction tracking</li>
                  <li>✓ Head pose estimation</li>
                  <li>✓ Face distance monitoring</li>
                  <li>✓ Lighting quality check</li>
                  <li>✓ Attention score calculation</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-blue-600" />
                  Privacy & Performance
                </h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>✓ 100% client-side processing</li>
                  <li>✓ No video uploaded to server</li>
                  <li>✓ GPU-accelerated (WebGL)</li>
                  <li>✓ Low CPU usage (~5-10%)</li>
                  <li>✓ Real-time (5 FPS detection)</li>
                  <li>✓ Works offline</li>
                  <li>✓ No external dependencies</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-purple-600" />
                  Technical Stack
                </h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• MediaPipe Face Landmarker</li>
                  <li>• WebGL/GPU Acceleration</li>
                  <li>• Browser getUserMedia API</li>
                  <li>• Canvas 2D Context</li>
                  <li>• Real-time metrics calculation</li>
                  <li>• Debounced event system</li>
                  <li>• TypeScript + React Hooks</li>
                </ul>
              </div>
            </div>

            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
              <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                How It Works
              </h4>
              <p className="text-sm text-blue-800 dark:text-blue-200">
                This proctoring system uses Google&apos;s MediaPipe Face Landmarker to detect 478 facial landmarks in real-time.
                All processing happens in your browser using WebGL acceleration. No video data is sent to any server,
                ensuring complete privacy. The system calculates attention scores, detects violations, and provides
                an integrity score based on behavior patterns.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
