'use client';

import { useSessionStore } from '@/src/stores/session';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
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
  Lightbulb
} from 'lucide-react';

export default function ResultPage() {
  const { uploadResponse, resetSession } = useSessionStore();
  const router = useRouter();

//   useEffect(() => {
//     if (!uploadResponse) {
//       router.push('/');
//     }
//   }, [uploadResponse, router]);

  const handleNewSession = () => {
    resetSession();
    router.push('/session');
  };


  if (!uploadResponse) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center flex-col justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">No results found</p>
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
    );
  }

  // Extract feedback data - it could be directly in output or nested
  const feedback = uploadResponse.output as {
    role?: string;
    clarity?: number;
    simplicity?: number;
    helpfulness?: number;
    quick_feedback?: string;
    strengths?: string[];
    weaknesses?: string[];
    questions?: string[];
  } | undefined;

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-600';
    if (score >= 6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreIcon = (score: number) => {
    if (score >= 8) return <CheckCircle className="h-5 w-5 text-green-600" />;
    if (score >= 6) return <AlertCircle className="h-5 w-5 text-yellow-600" />;
    return <AlertCircle className="h-5 w-5 text-red-600" />;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold text-gray-800 mb-2">What Duck Said</h1>
          <p className="text-gray-600">Your teaching performance analysis from Duck Teacher</p>
        </motion.div>
        {/* Role Badge */}
        {feedback?.role && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="flex justify-center mb-8"
          >
            <Badge variant="secondary" className="text-lg px-4 py-2">
              <Star className="h-4 w-4 mr-2" />
              Role: {feedback.role}
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
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="text-center pb-2">
              <CardTitle className="flex items-center justify-center gap-2">
                <Eye className="h-5 w-5 text-blue-600" />
                Clarity
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <div className="flex items-center justify-center mb-3">
                {getScoreIcon(feedback?.clarity || 0)}
                <span className={`text-3xl font-bold ml-2 ${getScoreColor(feedback?.clarity || 0)}`}>
                  {feedback?.clarity || 0}/10
                </span>
              </div>
              <Progress value={(feedback?.clarity || 0) * 10} className="h-2" />
            </CardContent>
          </Card>

          {/* Simplicity Score */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="text-center pb-2">
              <CardTitle className="flex items-center justify-center gap-2">
                <Lightbulb className="h-5 w-5 text-purple-600" />
                Simplicity
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <div className="flex items-center justify-center mb-3">
                {getScoreIcon(feedback?.simplicity || 0)}
                <span className={`text-3xl font-bold ml-2 ${getScoreColor(feedback?.simplicity || 0)}`}>
                  {feedback?.simplicity || 0}/10
                </span>
              </div>
              <Progress value={(feedback?.simplicity || 0) * 10} className="h-2" />
            </CardContent>
          </Card>

          {/* Helpfulness Score */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="text-center pb-2">
              <CardTitle className="flex items-center justify-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                Helpfulness
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <div className="flex items-center justify-center mb-3">
                {getScoreIcon(feedback?.helpfulness || 0)}
                <span className={`text-3xl font-bold ml-2 ${getScoreColor(feedback?.helpfulness || 0)}`}>
                  {feedback?.helpfulness || 0}/10
                </span>
              </div>
              <Progress value={(feedback?.helpfulness || 0) * 10} className="h-2" />
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
            <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5 text-blue-600" />
                  Quick Feedback
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 leading-relaxed">{feedback.quick_feedback}</p>
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
              <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-700">
                    <CheckCircle className="h-5 w-5" />
                    Strengths
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
                      className="flex items-start gap-2"
                    >
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0" />
                      <span className="text-gray-700">{strength}</span>
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
              <Card className="bg-gradient-to-r from-orange-50 to-red-50 border-orange-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-orange-700">
                  <AlertCircle className="h-5 w-5" />
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
                      className="flex items-start gap-2"
                    >
                      <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0" />
                      <span className="text-gray-700">{weakness}</span>
                    </motion.li>
                  ))}
                </ul>
              </CardContent>
            </Card>
            </motion.div>
          )}
        </div>

        {/* Questions */}
        {feedback?.questions && feedback.questions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="mb-8"
          >
            <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-purple-700">
                  <MessageCircle className="h-5 w-5" />
                  Reflection Questions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-4">
                  {feedback.questions.map((question: string, index: number) => (
                    <motion.li
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.7 + index * 0.1 }}
                      className="flex items-start gap-3"
                    >
                      <Badge variant="outline" className="flex-shrink-0 mt-1">
                        {index + 1}
                      </Badge>
                      <span className="text-gray-700">{question}</span>
                    </motion.li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.8 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
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