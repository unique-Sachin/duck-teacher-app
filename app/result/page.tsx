'use client';

import { useSessionStore } from '@/src/stores/session';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { motion } from 'framer-motion';
import { 
  Home, 
  RotateCcw, 
  Star, 
  CheckCircle, 
  AlertCircle, 
  MessageCircle,
  TrendingUp,
  Eye,
  Lightbulb,
  ThumbsUp,
  AlertTriangle
} from 'lucide-react';

export default function ResultPage() {
  const { uploadResponse, resetSession } = useSessionStore();
  const router = useRouter();

  const handleNewSession = () => {
    resetSession();
    router.push('/session');
  };

  if (!uploadResponse) {
    return (
      <div className="min-h-screen bg-background flex items-center flex-col justify-center p-4">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center">
            <AlertCircle className="h-8 w-8 text-muted-foreground" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold text-foreground">No Results Found</h2>
            <p className="text-muted-foreground">Please start a new session to get feedback.</p>
          </div>
          <Button 
            variant="outline" 
            onClick={() => router.push('/')}
            className="flex items-center gap-2"
            size="lg"
          >
            <Home className="h-4 w-4" />
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  // Extract feedback data
  const feedback = uploadResponse.output as {
    role?: string;
    clarity?: number;
    simplicity?: number;
    helpfulness?: number;
    quick_feedback?: string;
    strengths?: string[];
    weaknesses?: string[];
    questions?: string[];
    drawing_analysis?: {
      has_visual_content?: boolean;
      visual_description?: string;
      alignment_score?: number;
      visual_effectiveness?: number;
      visual_feedback?: string;
      visual_strengths?: string[];
      visual_improvements?: string[];
    };
  } | undefined;

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-600 dark:text-green-400';
    if (score >= 6) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getScoreIcon = (score: number) => {
    if (score >= 8) return <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />;
    if (score >= 6) return <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />;
    return <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />;
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8 space-y-4"
        >
          <h1 className="text-4xl font-bold text-foreground mb-2">Teaching Analysis Results</h1>
          <p className="text-muted-foreground text-lg">Your performance feedback from Evalyze</p>
          <Separator className="max-w-xs mx-auto" />
        </motion.div>

        {/* Role Badge */}
        {feedback?.role && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="flex justify-center mb-8"
          >
            <Badge variant="secondary" className="text-base px-6 py-2">
              <Star className="h-4 w-4 mr-2" />
              Teaching Role: {feedback.role}
            </Badge>
          </motion.div>
        )}

        {/* Scores Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
        >
          {/* Clarity Score */}
          <Card className="border-2 hover:shadow-lg transition-all duration-200">
            <CardHeader className="text-center pb-3">
              <CardTitle className="flex items-center justify-center gap-2 text-lg">
                <Eye className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                Clarity
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <div className="flex items-center justify-center gap-3">
                {getScoreIcon(feedback?.clarity || 0)}
                <span className={`text-4xl font-bold ${getScoreColor(feedback?.clarity || 0)}`}>
                  {feedback?.clarity || 0}
                </span>
                <span className="text-2xl text-muted-foreground">/10</span>
              </div>
              <div className="space-y-2">
                <Progress 
                  value={(feedback?.clarity || 0) * 10} 
                  className="h-3"
                />
                <p className="text-sm text-muted-foreground">
                  How clear your explanations were
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Simplicity Score */}
          <Card className="border-2 hover:shadow-lg transition-all duration-200">
            <CardHeader className="text-center pb-3">
              <CardTitle className="flex items-center justify-center gap-2 text-lg">
                <Lightbulb className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                Simplicity
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <div className="flex items-center justify-center gap-3">
                {getScoreIcon(feedback?.simplicity || 0)}
                <span className={`text-4xl font-bold ${getScoreColor(feedback?.simplicity || 0)}`}>
                  {feedback?.simplicity || 0}
                </span>
                <span className="text-2xl text-muted-foreground">/10</span>
              </div>
              <div className="space-y-2">
                <Progress 
                  value={(feedback?.simplicity || 0) * 10} 
                  className="h-3"
                />
                <p className="text-sm text-muted-foreground">
                  How easy to understand you were
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Helpfulness Score */}
          <Card className="border-2 hover:shadow-lg transition-all duration-200">
            <CardHeader className="text-center pb-3">
              <CardTitle className="flex items-center justify-center gap-2 text-lg">
                <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
                Helpfulness
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <div className="flex items-center justify-center gap-3">
                {getScoreIcon(feedback?.helpfulness || 0)}
                <span className={`text-4xl font-bold ${getScoreColor(feedback?.helpfulness || 0)}`}>
                  {feedback?.helpfulness || 0}
                </span>
                <span className="text-2xl text-muted-foreground">/10</span>
              </div>
              <div className="space-y-2">
                <Progress 
                  value={(feedback?.helpfulness || 0) * 10} 
                  className="h-3"
                />
                <p className="text-sm text-muted-foreground">
                  How helpful your teaching was
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Quick Feedback */}
        {feedback?.quick_feedback && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mb-8"
          >
            <Card className="border-l-4 border-l-blue-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  Overall Feedback
                </CardTitle>
              </CardHeader>
              <CardContent>
                <blockquote className="text-foreground leading-relaxed italic border-l-2 border-muted pl-4">
                  &ldquo;{feedback.quick_feedback}&rdquo;
                </blockquote>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Strengths and Weaknesses */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Strengths */}
          {feedback?.strengths && feedback.strengths.length > 0 && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <Card className="border-l-4 border-l-green-500">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-400">
                    <ThumbsUp className="h-5 w-5" />
                    What You Did Well
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {feedback.strengths.map((strength: string, index: number) => (
                      <motion.li
                        key={index}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: 0.5 + index * 0.1 }}
                        className="flex items-start gap-3 p-3 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-100 dark:border-green-900/30"
                      >
                        <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                        <span className="text-foreground">{strength}</span>
                      </motion.li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Weaknesses */}
          {feedback?.weaknesses && feedback.weaknesses.length > 0 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <Card className="border-l-4 border-l-orange-500">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-orange-700 dark:text-orange-400">
                    <AlertTriangle className="h-5 w-5" />
                    Areas for Improvement
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {feedback.weaknesses.map((weakness: string, index: number) => (
                      <motion.li
                        key={index}
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: 0.5 + index * 0.1 }}
                        className="flex items-start gap-3 p-3 rounded-lg bg-orange-50 dark:bg-orange-950/20 border border-orange-100 dark:border-orange-900/30"
                      >
                        <AlertTriangle className="h-5 w-5 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" />
                        <span className="text-foreground">{weakness}</span>
                      </motion.li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>

        {/* Drawing Analysis */}
        {feedback?.drawing_analysis && feedback.drawing_analysis.has_visual_content && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="mb-8"
          >
            <Card className="border-l-4 border-l-cyan-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-cyan-700 dark:text-cyan-400">
                  <Eye className="h-5 w-5" />
                  Visual Teaching Analysis
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Visual Description */}
                <div className="space-y-3">
                  <h4 className="font-medium text-foreground">What You Drew</h4>
                  <p className="text-muted-foreground leading-relaxed bg-cyan-50 dark:bg-cyan-950/20 p-4 rounded-lg border border-cyan-100 dark:border-cyan-900/30">
                    {feedback.drawing_analysis.visual_description}
                  </p>
                </div>

                {/* Visual Scores */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Alignment with Explanation</span>
                      <span className={`text-lg font-bold ${getScoreColor(feedback.drawing_analysis.alignment_score || 0)}`}>
                        {feedback.drawing_analysis.alignment_score || 0}/10
                      </span>
                    </div>
                    <Progress value={(feedback.drawing_analysis.alignment_score || 0) * 10} className="h-2" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Visual Effectiveness</span>
                      <span className={`text-lg font-bold ${getScoreColor(feedback.drawing_analysis.visual_effectiveness || 0)}`}>
                        {feedback.drawing_analysis.visual_effectiveness || 0}/10
                      </span>
                    </div>
                    <Progress value={(feedback.drawing_analysis.visual_effectiveness || 0) * 10} className="h-2" />
                  </div>
                </div>

                {/* Visual Feedback */}
                {feedback.drawing_analysis.visual_feedback && (
                  <div className="space-y-3">
                    <h4 className="font-medium text-foreground">Visual Feedback</h4>
                    <blockquote className="text-foreground leading-relaxed italic border-l-2 border-cyan-500 pl-4">
                      &ldquo;{feedback.drawing_analysis.visual_feedback}&rdquo;
                    </blockquote>
                  </div>
                )}

                {/* Visual Strengths and Improvements */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Visual Strengths */}
                  {feedback.drawing_analysis.visual_strengths && feedback.drawing_analysis.visual_strengths.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="font-medium text-green-700 dark:text-green-400 flex items-center gap-2">
                        <ThumbsUp className="h-4 w-4" />
                        Visual Strengths
                      </h4>
                      <ul className="space-y-2">
                        {feedback.drawing_analysis.visual_strengths.map((strength: string, index: number) => (
                          <li
                            key={index}
                            className="flex items-start gap-2 p-2 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-100 dark:border-green-900/30"
                          >
                            <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                            <span className="text-sm text-foreground">{strength}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Visual Improvements */}
                  {feedback.drawing_analysis.visual_improvements && feedback.drawing_analysis.visual_improvements.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="font-medium text-orange-700 dark:text-orange-400 flex items-center gap-2">
                        <Lightbulb className="h-4 w-4" />
                        Visual Improvements
                      </h4>
                      <ul className="space-y-2">
                        {feedback.drawing_analysis.visual_improvements.map((improvement: string, index: number) => (
                          <li
                            key={index}
                            className="flex items-start gap-2 p-2 rounded-lg bg-orange-50 dark:bg-orange-950/20 border border-orange-100 dark:border-orange-900/30"
                          >
                            <Lightbulb className="h-4 w-4 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" />
                            <span className="text-sm text-foreground">{improvement}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Questions */}
        {feedback?.questions && feedback.questions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.7 }}
            className="mb-8"
          >
            <Card className="border-l-4 border-l-purple-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-purple-700 dark:text-purple-400">
                  <MessageCircle className="h-5 w-5" />
                  Reflection Questions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {feedback.questions.map((question: string, index: number) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.8 + index * 0.1 }}
                      className="flex items-start gap-4 p-4 rounded-lg bg-purple-50 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/30"
                    >
                      <Badge variant="outline" className="flex-shrink-0 mt-1 min-w-[2rem] text-center">
                        {index + 1}
                      </Badge>
                      <p className="text-foreground leading-relaxed">{question}</p>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.9 }}
          className="flex flex-col sm:flex-row gap-4 justify-center pt-8"
        >
          <Button 
            onClick={handleNewSession} 
            className="flex items-center gap-2"
            size="lg"
          >
            <RotateCcw className="h-4 w-4" />
            Start New Session
          </Button>
          
          <Button 
            variant="outline" 
            onClick={() => router.push('/')}
            className="flex items-center gap-2"
            size="lg"
          >
            <Home className="h-4 w-4" />
            Back to Home
          </Button>
        </motion.div>
      </div>
    </div>
  );
}