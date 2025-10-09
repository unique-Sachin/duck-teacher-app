"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { motion } from "framer-motion";
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  MessageSquare,
  TrendingUp,
  User,
  Bot,
  Award,
  CheckCircle,
  AlertCircle,
  Target,
  Lightbulb,
  ThumbsUp,
  Shield,
  Eye,
  AlertTriangle
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import { getRoleConfig } from "@/src/config/roles";

interface Message {
  id: string;
  role: "INTERVIEWER" | "CANDIDATE";
  content: string;
  timestamp: Date;
}

interface ProctoringSession {
  id: string;
  startedAt: Date;
  endedAt: Date | null;
  totalDurationSeconds: number | null;
  totalViolations: number;
  noFaceDetectedSeconds: number;
  multipleFacesCount: number;
  lookingAwayCount: number;
  tabSwitchCount: number;
  averageAttentionScore: number;
  integrityScore: number;
  riskLevel: string;
  suspiciousPatterns: string[] | null;
}

interface Interview {
  id: string;
  roleId: string;
  status: string;
  startedAt: string;
  completedAt: string | null;
  durationMinutes: number | null;
  totalQuestions: number;
  questionsAsked: number;
  analysisScores: Record<string, number> | null;
  strengths: string[];
  improvements: string[];
  insights: string[];
  recommendation: string | null;
  overallScore: number | null;
  messages: Message[];
  proctoringSession?: ProctoringSession;
}

export default function InterviewDetailPage() {
  const { status } = useSession();
  const router = useRouter();
  const params = useParams();
  const interviewId = params.id as string;
  
  const [interview, setInterview] = useState<Interview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
      return;
    }

    if (status === "authenticated" && interviewId) {
      fetchInterviewDetails();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, router, interviewId]);

  const fetchInterviewDetails = async () => {
    try {
      const response = await fetch(`/api/interviews/${interviewId}`);
      if (response.ok) {
        const data = await response.json();
        setInterview(data);
      } else if (response.status === 404) {
        router.push("/history");
      }
    } catch (error) {
      console.error("Failed to fetch interview:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || status === "loading") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading interview details...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!interview) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-2xl font-bold mb-2">Interview Not Found</h2>
            <p className="text-muted-foreground mb-6">
              The interview you&apos;re looking for doesn&apos;t exist or you don&apos;t have permission to view it.
            </p>
            <Button onClick={() => router.push("/history")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to History
            </Button>
          </div>
        </main>
      </div>
    );
  }

  const roleConfig = getRoleConfig(interview.roleId);
  const Icon = roleConfig?.icon;
  const isCompleted = interview.status === "COMPLETED";
  const hasAnalysis = isCompleted && interview.analysisScores;

  const getStatusBadge = (status: string) => {
    type BadgeVariant = "default" | "destructive" | "outline" | "secondary";
    const statusConfig: { [key: string]: { label: string; variant: BadgeVariant; className: string } } = {
      IN_PROGRESS: { label: "In Progress", variant: "default" as const, className: "bg-blue-500 text-white" },
      COMPLETED: { label: "Completed", variant: "default" as const, className: "bg-green-500 text-white" },
      ABANDONED: { label: "Abandoned", variant: "destructive" as const, className: "bg-gray-500 text-white" },
      FLAGGED: { label: "Flagged", variant: "destructive" as const, className: "bg-red-500 text-white" },
    };
    const config = statusConfig[status] || statusConfig.COMPLETED;
    return <Badge variant={config.variant} className={config.className}>{config.label}</Badge>;
  };

  const getRiskBadge = (riskLevel: string) => {
    const riskConfig: { [key: string]: { className: string } } = {
      VERY_LOW: { className: "bg-green-500 text-white" },
      LOW: { className: "bg-green-400 text-white" },
      MODERATE: { className: "bg-yellow-500 text-white" },
      HIGH: { className: "bg-orange-500 text-white" },
      CRITICAL: { className: "bg-red-500 text-white" },
    };
    const config = riskConfig[riskLevel] || riskConfig.LOW;
    return <Badge className={config.className}>{riskLevel.replace('_', ' ')}</Badge>;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Button
            variant="ghost"
            onClick={() => router.push("/history")}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to History
          </Button>

          <div className="flex items-start gap-4">
            {Icon && (
              <div className={`p-4 rounded-lg ${roleConfig.bgColor}`}>
                <Icon className={`h-8 w-8 ${roleConfig.color}`} />
              </div>
            )}
            <div className="flex-1">
              <h1 className="text-3xl font-bold mb-2">
                {roleConfig?.title || interview.roleId} Interview
              </h1>
              <div className="flex flex-wrap gap-4 text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {new Date(interview.startedAt).toLocaleString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
                {interview.durationMinutes && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    {interview.durationMinutes} minutes
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  {interview.messages?.length || 0} messages
                </div>
                {getStatusBadge(interview.status)}
              </div>
            </div>
            {hasAnalysis && interview.overallScore && (
              <div className="text-center">
                <div className="text-sm text-muted-foreground mb-2">Overall Score</div>
                <div className="text-4xl font-bold text-primary">
                  {interview.overallScore.toFixed(1)}<span className="text-2xl text-muted-foreground">/10</span>
                </div>
              </div>
            )}
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Transcript */}
          <div className="lg:col-span-2 space-y-6">
            {/* Transcript Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    Interview Transcript
                  </CardTitle>
                  <CardDescription>
                    Complete conversation history
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[600px] pr-4">
                    {interview.messages && interview.messages.length > 0 ? (
                      <div className="space-y-4">
                        {interview.messages.map((message, index) => (
                          <motion.div
                            key={message.id}
                            initial={{ opacity: 0, x: message.role === "INTERVIEWER" ? -20 : 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.02 }}
                            className={`flex gap-3 ${message.role === "CANDIDATE" ? "flex-row-reverse" : ""}`}
                          >
                            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                              message.role === "INTERVIEWER" 
                                ? "bg-blue-100 dark:bg-blue-900" 
                                : "bg-purple-100 dark:bg-purple-900"
                            }`}>
                              {message.role === "INTERVIEWER" ? (
                                <Bot className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                              ) : (
                                <User className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                              )}
                            </div>
                            <div className={`flex-1 ${message.role === "CANDIDATE" ? "text-right" : ""}`}>
                              <div className={`inline-block max-w-[85%] rounded-lg p-3 ${
                                message.role === "INTERVIEWER"
                                  ? "bg-gray-100 dark:bg-gray-800 text-left"
                                  : "bg-primary/10 text-left"
                              }`}>
                                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                              </div>
                              <div className="text-xs text-muted-foreground mt-1">
                                {new Date(message.timestamp).toLocaleTimeString('en-US', {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12 text-muted-foreground">
                        <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No messages in this interview</p>
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Right Column - Stats & Analysis */}
          <div className="space-y-6">
            {/* Score Breakdown */}
            {hasAnalysis && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Score Breakdown
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {interview.analysisScores && Object.entries(interview.analysisScores).map(([key, value]) => (
                      <div key={key}>
                        <div className="flex justify-between mb-2">
                          <span className="text-sm capitalize">{key.replace(/_/g, ' ')}</span>
                          <span className="text-sm font-semibold">{typeof value === 'number' ? value : 0}/10</span>
                        </div>
                        <Progress value={(typeof value === 'number' ? value : 0) * 10} className="h-2" />
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Proctoring Stats */}
            {interview.proctoringSession && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5" />
                      Proctoring Report
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Integrity Score</span>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold">
                          {interview.proctoringSession.integrityScore}%
                        </span>
                        {getRiskBadge(interview.proctoringSession.riskLevel)}
                      </div>
                    </div>
                    <Progress value={interview.proctoringSession.integrityScore} className="h-2" />
                    
                    <Separator />
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Eye className="h-4 w-4" />
                          Looking Away
                        </div>
                        <span className="font-semibold">{interview.proctoringSession.lookingAwayCount}</span>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <User className="h-4 w-4" />
                          Multiple Faces
                        </div>
                        <span className="font-semibold">{interview.proctoringSession.multipleFacesCount}</span>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <AlertTriangle className="h-4 w-4" />
                          No Face Detected
                        </div>
                        <span className="font-semibold">{interview.proctoringSession.noFaceDetectedSeconds}s</span>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          Avg Attention
                        </div>
                        <span className="font-semibold">{interview.proctoringSession.averageAttentionScore}%</span>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div className="text-xs text-muted-foreground">
                      Total Violations: {interview.proctoringSession.totalViolations}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Strengths */}
            {interview.strengths && interview.strengths.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ThumbsUp className="h-5 w-5 text-green-600" />
                      Strengths
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {interview.strengths.map((strength, index) => (
                        <li key={index} className="flex gap-2 text-sm">
                          <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                          <span>{strength}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Areas for Improvement */}
            {interview.improvements && interview.improvements.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5 text-orange-600" />
                      Areas for Improvement
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {interview.improvements.map((improvement, index) => (
                        <li key={index} className="flex gap-2 text-sm">
                          <AlertCircle className="h-4 w-4 text-orange-600 flex-shrink-0 mt-0.5" />
                          <span>{improvement}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Key Insights */}
            {interview.insights && interview.insights.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Lightbulb className="h-5 w-5 text-yellow-600" />
                      Key Insights
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {interview.insights.map((insight, index) => (
                        <li key={index} className="flex gap-2 text-sm">
                          <span className="text-yellow-600 flex-shrink-0">•</span>
                          <span>{insight}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Recommendation */}
            {interview.recommendation && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Award className="h-5 w-5" />
                      Hiring Recommendation
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">{interview.recommendation}</p>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
