'use client';

import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  ArrowLeft,
  Plus,
  Edit,
  Trash2,
  MessageSquare,
  Clock,
  Tag,
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

interface FollowUp {
  id: string;
  followUp: string;
  answer: string | null;
  order: number;
}

interface Question {
  id: string;
  question: string;
  answer: string | null;
  category: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  expectedTopics: string[];
  timeEstimate: number | null;
  order: number;
  isActive: boolean;
  followUps: FollowUp[];
}

interface Role {
  id: string;
  title: string;
}

function QuestionsManagementContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState<string>('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [isQuestionDialogOpen, setIsQuestionDialogOpen] = useState(false);
  const [isFollowUpDialogOpen, setIsFollowUpDialogOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [editingFollowUp, setEditingFollowUp] = useState<FollowUp | null>(null);
  const [currentQuestionId, setCurrentQuestionId] = useState<string | null>(null);
  
  const [questionForm, setQuestionForm] = useState({
    question: '',
    answer: '',
    category: '',
    difficulty: 'MEDIUM' as 'EASY' | 'MEDIUM' | 'HARD',
    expectedTopics: '',
    timeEstimate: 5,
  });

  const [followUpForm, setFollowUpForm] = useState({
    followUp: '',
    answer: '',
  });

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role !== 'ADMIN') {
      router.push('/dashboard');
    } else if (status === 'authenticated') {
      fetchRoles();
    }
  }, [session, status, router]);

  useEffect(() => {
    const roleIdFromUrl = searchParams.get('roleId');
    if (roleIdFromUrl) {
      setSelectedRoleId(roleIdFromUrl);
    }
  }, [searchParams]);

  useEffect(() => {
    if (selectedRoleId) {
      fetchQuestions();
    }
  }, [selectedRoleId]);

  const fetchRoles = async () => {
    try {
      const response = await fetch('/api/admin/roles');
      if (response.ok) {
        const data = await response.json();
        setRoles(data);
        if (!selectedRoleId && data.length > 0) {
          setSelectedRoleId(data[0].id);
        }
      }
    } catch (error) {
      console.error('Error fetching roles:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchQuestions = async () => {
    if (!selectedRoleId) return;
    
    try {
      const response = await fetch(`/api/admin/questions?roleId=${selectedRoleId}`);
      if (response.ok) {
        const data = await response.json();
        setQuestions(data);
      } else {
        toast.error('Failed to fetch questions');
      }
    } catch (error) {
      toast.error('Error fetching questions');
      console.error(error);
    }
  };

  const handleOpenQuestionDialog = (question?: Question) => {
    if (question) {
      setEditingQuestion(question);
      setQuestionForm({
        question: question.question,
        answer: question.answer || '',
        category: question.category,
        difficulty: question.difficulty,
        expectedTopics: question.expectedTopics.join(', '),
        timeEstimate: question.timeEstimate || 5,
      });
    } else {
      setEditingQuestion(null);
      setQuestionForm({
        question: '',
        answer: '',
        category: '',
        difficulty: 'MEDIUM',
        expectedTopics: '',
        timeEstimate: 5,
      });
    }
    setIsQuestionDialogOpen(true);
  };

  const handleOpenFollowUpDialog = (questionId: string, followUp?: FollowUp) => {
    setCurrentQuestionId(questionId);
    if (followUp) {
      setEditingFollowUp(followUp);
      setFollowUpForm({
        followUp: followUp.followUp,
        answer: followUp.answer || '',
      });
    } else {
      setEditingFollowUp(null);
      setFollowUpForm({
        followUp: '',
        answer: '',
      });
    }
    setIsFollowUpDialogOpen(true);
  };

  const handleSubmitQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const topicsArray = questionForm.expectedTopics
      .split(',')
      .map(t => t.trim())
      .filter(t => t);
    
    try {
      const url = '/api/admin/questions';
      const method = editingQuestion ? 'PATCH' : 'POST';
      
      const body: {
        roleId: string;
        question: string;
        answer: string | null;
        category: string;
        difficulty: 'EASY' | 'MEDIUM' | 'HARD';
        expectedTopics: string[];
        timeEstimate: number;
        id?: string;
      } = {
        roleId: selectedRoleId,
        question: questionForm.question,
        answer: questionForm.answer || null,
        category: questionForm.category,
        difficulty: questionForm.difficulty,
        expectedTopics: topicsArray,
        timeEstimate: questionForm.timeEstimate,
      };

      if (editingQuestion) {
        body.id = editingQuestion.id;
      }

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        toast.success(editingQuestion ? 'Question updated' : 'Question created');
        setIsQuestionDialogOpen(false);
        fetchQuestions();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to save question');
      }
    } catch (error) {
      toast.error('Error saving question');
      console.error(error);
    }
  };

  const handleSubmitFollowUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentQuestionId) return;

    try {
      const url = '/api/admin/follow-ups';
      const method = editingFollowUp ? 'PATCH' : 'POST';
      
      const body: {
        questionId: string;
        followUp: string;
        answer: string | null;
        id?: string;
      } = {
        questionId: currentQuestionId,
        followUp: followUpForm.followUp,
        answer: followUpForm.answer || null,
      };

      if (editingFollowUp) {
        body.id = editingFollowUp.id;
      }

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        toast.success(editingFollowUp ? 'Follow-up updated' : 'Follow-up created');
        setIsFollowUpDialogOpen(false);
        fetchQuestions();
      } else {
        toast.error('Failed to save follow-up');
      }
    } catch (error) {
      toast.error('Error saving follow-up');
      console.error(error);
    }
  };

  const handleDeleteQuestion = async (questionId: string) => {
    if (!confirm('Are you sure you want to delete this question?')) return;

    try {
      const response = await fetch(`/api/admin/questions?id=${questionId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Question deleted');
        fetchQuestions();
      } else {
        toast.error('Failed to delete question');
      }
    } catch (error) {
      toast.error('Error deleting question');
      console.error(error);
    }
  };

  const handleDeleteFollowUp = async (followUpId: string) => {
    if (!confirm('Are you sure you want to delete this follow-up?')) return;

    try {
      const response = await fetch(`/api/admin/follow-ups?id=${followUpId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Follow-up deleted');
        fetchQuestions();
      } else {
        toast.error('Failed to delete follow-up');
      }
    } catch (error) {
      toast.error('Error deleting follow-up');
      console.error(error);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'EASY': return 'bg-green-500/10 text-green-700 dark:text-green-400';
      case 'MEDIUM': return 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400';
      case 'HARD': return 'bg-red-500/10 text-red-700 dark:text-red-400';
      default: return 'bg-gray-500/10 text-gray-700 dark:text-gray-400';
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (session?.user?.role !== 'ADMIN') {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <Link href="/admin">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Admin Dashboard
          </Button>
        </Link>
        
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <MessageSquare className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-bold">Questions Bank</h1>
            </div>
            <p className="text-muted-foreground">
              Manage interview questions and follow-ups
            </p>
          </div>
          <Button onClick={() => handleOpenQuestionDialog()} disabled={!selectedRoleId}>
            <Plus className="h-4 w-4 mr-2" />
            Add Question
          </Button>
        </div>

        {/* Role Selector */}
        <div className="flex gap-4 items-center">
          <Label htmlFor="role-select" className="whitespace-nowrap">Select Role:</Label>
          <Select value={selectedRoleId} onValueChange={setSelectedRoleId}>
            <SelectTrigger id="role-select" className="w-[300px]">
              <SelectValue placeholder="Select a role" />
            </SelectTrigger>
            <SelectContent>
              {roles.map((role) => (
                <SelectItem key={role.id} value={role.id}>
                  {role.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Badge variant="outline">
            {questions.length} questions
          </Badge>
        </div>
      </div>

      {/* Questions List */}
      <div className="space-y-4">
        {questions.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No questions yet</h3>
              <p className="text-muted-foreground text-center mb-4">
                Add your first question for this role
              </p>
              <Button onClick={() => handleOpenQuestionDialog()}>
                <Plus className="h-4 w-4 mr-2" />
                Add Question
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Accordion type="single" collapsible className="space-y-4">
            {questions.map((question, index) => (
              <AccordionItem key={question.id} value={question.id} className="border rounded-lg">
                <Card className="border-0">
                  <AccordionTrigger className="hover:no-underline px-6 py-4">
                    <div className="flex items-start justify-between w-full pr-4">
                      <div className="flex-1 text-left">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline" className="font-mono">
                            #{index + 1}
                          </Badge>
                          <Badge className={getDifficultyColor(question.difficulty)}>
                            {question.difficulty}
                          </Badge>
                          <Badge variant="secondary">{question.category}</Badge>
                          {!question.isActive && (
                            <Badge variant="destructive">Inactive</Badge>
                          )}
                        </div>
                        <h3 className="font-semibold text-base">
                          {question.question}
                        </h3>
                      </div>
                    </div>
                  </AccordionTrigger>
                  
                  <AccordionContent>
                    <div className="px-6 pb-4 space-y-4">
                      {/* Question Details */}
                      <div className="space-y-3">
                        {question.answer && (
                          <div>
                            <Label className="text-xs text-muted-foreground">Expected Answer:</Label>
                            <p className="text-sm mt-1 p-3 bg-muted rounded-md">
                              {question.answer}
                            </p>
                          </div>
                        )}
                        
                        <div className="flex flex-wrap gap-4 text-sm">
                          {question.timeEstimate && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Clock className="h-4 w-4" />
                              <span>{question.timeEstimate} min</span>
                            </div>
                          )}
                          {question.expectedTopics.length > 0 && (
                            <div className="flex items-center gap-2">
                              <Tag className="h-4 w-4 text-muted-foreground" />
                              <div className="flex flex-wrap gap-1">
                                {question.expectedTopics.map((topic, idx) => (
                                  <Badge key={idx} variant="outline" className="text-xs">
                                    {topic}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Follow-ups */}
                      <div className="border-t pt-4">
                        <div className="flex items-center justify-between mb-3">
                          <Label className="text-sm font-semibold">
                            Follow-up Questions ({question.followUps.length})
                          </Label>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenFollowUpDialog(question.id)}
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Add Follow-up
                          </Button>
                        </div>
                        
                        {question.followUps.length > 0 ? (
                          <div className="space-y-2">
                            {question.followUps.map((followUp, idx) => (
                              <div key={followUp.id} className="p-3 bg-muted/50 rounded-md">
                                <div className="flex items-start justify-between mb-1">
                                  <p className="text-sm font-medium flex-1">
                                    {idx + 1}. {followUp.followUp}
                                  </p>
                                  <div className="flex gap-1">
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => handleOpenFollowUpDialog(question.id, followUp)}
                                    >
                                      <Edit className="h-3 w-3" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => handleDeleteFollowUp(followUp.id)}
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>
                                {followUp.answer && (
                                  <p className="text-xs text-muted-foreground mt-2">
                                    Answer: {followUp.answer}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground text-center py-4">
                            No follow-up questions yet
                          </p>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 pt-2 border-t">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenQuestionDialog(question)}
                        >
                          <Edit className="h-3 w-3 mr-1" />
                          Edit Question
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteQuestion(question.id)}
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </AccordionContent>
                </Card>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </div>

      {/* Question Dialog */}
      <Dialog open={isQuestionDialogOpen} onOpenChange={setIsQuestionDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingQuestion ? 'Edit Question' : 'Create New Question'}
            </DialogTitle>
            <DialogDescription>
              {editingQuestion
                ? 'Update the question details below'
                : 'Add a new interview question'}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmitQuestion}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="question">Question *</Label>
                <Textarea
                  id="question"
                  placeholder="Enter the interview question..."
                  value={questionForm.question}
                  onChange={(e) => setQuestionForm({ ...questionForm, question: e.target.value })}
                  rows={3}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="answer">Expected Answer</Label>
                <Textarea
                  id="answer"
                  placeholder="Enter the expected/correct answer (for reference)..."
                  value={questionForm.answer}
                  onChange={(e) => setQuestionForm({ ...questionForm, answer: e.target.value })}
                  rows={4}
                />
                <p className="text-xs text-muted-foreground">
                  This helps evaluate candidate responses
                </p>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Input
                    id="category"
                    placeholder="e.g., Fundamentals"
                    value={questionForm.category}
                    onChange={(e) => setQuestionForm({ ...questionForm, category: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="difficulty">Difficulty *</Label>
                  <Select
                    value={questionForm.difficulty}
                    onValueChange={(value: 'EASY' | 'MEDIUM' | 'HARD') =>
                      setQuestionForm({ ...questionForm, difficulty: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EASY">Easy</SelectItem>
                      <SelectItem value="MEDIUM">Medium</SelectItem>
                      <SelectItem value="HARD">Hard</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="timeEstimate">Time (min)</Label>
                  <Input
                    id="timeEstimate"
                    type="number"
                    min="1"
                    max="60"
                    value={questionForm.timeEstimate}
                    onChange={(e) => setQuestionForm({ ...questionForm, timeEstimate: parseInt(e.target.value) })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="expectedTopics">Expected Topics (comma-separated)</Label>
                <Textarea
                  id="expectedTopics"
                  placeholder="e.g., transformers, neural networks, attention mechanism"
                  value={questionForm.expectedTopics}
                  onChange={(e) => setQuestionForm({ ...questionForm, expectedTopics: e.target.value })}
                  rows={2}
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsQuestionDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {editingQuestion ? 'Update Question' : 'Create Question'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Follow-up Dialog */}
      <Dialog open={isFollowUpDialogOpen} onOpenChange={setIsFollowUpDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingFollowUp ? 'Edit Follow-up' : 'Add Follow-up Question'}
            </DialogTitle>
            <DialogDescription>
              {editingFollowUp
                ? 'Update the follow-up question'
                : 'Add a follow-up question to dig deeper'}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmitFollowUp}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="followUp">Follow-up Question *</Label>
                <Textarea
                  id="followUp"
                  placeholder="Enter the follow-up question..."
                  value={followUpForm.followUp}
                  onChange={(e) => setFollowUpForm({ ...followUpForm, followUp: e.target.value })}
                  rows={2}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="followUpAnswer">Expected Answer</Label>
                <Textarea
                  id="followUpAnswer"
                  placeholder="Enter the expected answer..."
                  value={followUpForm.answer}
                  onChange={(e) => setFollowUpForm({ ...followUpForm, answer: e.target.value })}
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsFollowUpDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {editingFollowUp ? 'Update Follow-up' : 'Add Follow-up'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function QuestionsManagement() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    }>
      <QuestionsManagementContent />
    </Suspense>
  );
}
