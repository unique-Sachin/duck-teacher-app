import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Lightbulb, Target } from "lucide-react";
import type { InterviewAnalysis } from "@/src/hooks/useDeepgramVoiceAgent";

interface InterviewAnalysisDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  analysis: InterviewAnalysis | null;
}

export function InterviewAnalysisDialog({
  open,
  onOpenChange,
  analysis
}: InterviewAnalysisDialogProps) {
  if (!analysis) return null;

  const getScoreColor = (score: number) => {
    if (score >= 8) return "text-green-600 dark:text-green-400";
    if (score >= 6) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  const getRecommendationBadge = (rec: string) => {
    const badges: Record<string, { text: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      'strong_yes': { text: 'Strong Yes', variant: 'default' },
      'yes': { text: 'Yes', variant: 'default' },
      'maybe': { text: 'Maybe', variant: 'secondary' },
      'no': { text: 'No', variant: 'destructive' },
      'strong_no': { text: 'Strong No', variant: 'destructive' }
    };
    
    const badge = badges[rec] || { text: 'Under Review', variant: 'secondary' };
    return <Badge variant={badge.variant as "default" | "secondary" | "destructive" | "outline"}>{badge.text}</Badge>;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Interview Performance Analysis</DialogTitle>
          <DialogDescription>
            Here&apos;s a comprehensive analysis of your interview performance
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Overall Score */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Overall Score</span>
                <span className={`text-3xl font-bold ${getScoreColor(analysis.overall_score)}`}>
                  {analysis.overall_score.toFixed(1)}/10
                </span>
              </CardTitle>
              <CardDescription>Hiring Recommendation: {getRecommendationBadge(analysis.hiring_recommendation)}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{analysis.summary}</p>
            </CardContent>
          </Card>

          {/* Individual Scores */}
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Technical Knowledge</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className={`text-2xl font-bold ${getScoreColor(analysis.technical_knowledge)}`}>
                      {analysis.technical_knowledge.toFixed(1)}
                    </span>
                    <span className="text-sm text-muted-foreground">/10</span>
                  </div>
                  <Progress value={analysis.technical_knowledge * 10} className="h-2" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Communication</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className={`text-2xl font-bold ${getScoreColor(analysis.communication)}`}>
                      {analysis.communication.toFixed(1)}
                    </span>
                    <span className="text-sm text-muted-foreground">/10</span>
                  </div>
                  <Progress value={analysis.communication * 10} className="h-2" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Problem Solving</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className={`text-2xl font-bold ${getScoreColor(analysis.problem_solving)}`}>
                      {analysis.problem_solving.toFixed(1)}
                    </span>
                    <span className="text-sm text-muted-foreground">/10</span>
                  </div>
                  <Progress value={analysis.problem_solving * 10} className="h-2" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Experience</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className={`text-2xl font-bold ${getScoreColor(analysis.experience)}`}>
                      {analysis.experience.toFixed(1)}
                    </span>
                    <span className="text-sm text-muted-foreground">/10</span>
                  </div>
                  <Progress value={analysis.experience * 10} className="h-2" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Strengths */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                Key Strengths
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {analysis.strengths.map((strength, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-green-600 mt-0.5">•</span>
                    <span className="text-sm">{strength}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Areas for Improvement */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-orange-600" />
                Areas for Improvement
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {analysis.areas_for_improvement.map((area, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-orange-600 mt-0.5">•</span>
                    <span className="text-sm">{area}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Key Insights */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-blue-600" />
                Key Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {analysis.key_insights.map((insight, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-blue-600 mt-0.5">•</span>
                    <span className="text-sm">{insight}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
