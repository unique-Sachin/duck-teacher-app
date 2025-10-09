"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { 
  Calendar, 
  Clock, 
  Filter,
  Search,
  Loader2,
  ArrowLeft,
  TrendingUp,
  MessageSquare
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import { getRoleConfig, getAllRoles } from "@/src/config/roles";

interface Interview {
  id: string;
  roleId: string;
  status: string;
  startedAt: string;
  completedAt: string | null;
  durationMinutes: number | null;
  overallScore: number | null;
  totalQuestions: number;
  _count: {
    messages: number;
  };
}

export default function HistoryPage() {
  const { status } = useSession();
  const router = useRouter();
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [filteredInterviews, setFilteredInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
      return;
    }

    if (status === "authenticated") {
      fetchInterviews();
    }
  }, [status, router]);

  useEffect(() => {
    filterInterviews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [interviews, searchQuery, statusFilter, roleFilter]);

  const fetchInterviews = async () => {
    try {
      const response = await fetch("/api/interviews");
      if (response.ok) {
        const data = await response.json();
        setInterviews(data);
        setFilteredInterviews(data);
      }
    } catch (error) {
      console.error("Failed to fetch interviews:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterInterviews = () => {
    let filtered = [...interviews];

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((interview) => interview.status === statusFilter);
    }

    // Role filter
    if (roleFilter !== "all") {
      filtered = filtered.filter((interview) => interview.roleId === roleFilter);
    }

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter((interview) => {
        const roleConfig = getRoleConfig(interview.roleId);
        return roleConfig?.title.toLowerCase().includes(searchQuery.toLowerCase());
      });
    }

    setFilteredInterviews(filtered);
  };



  const getStatusBadge = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return (
          <Badge className="bg-green-500/10 text-green-500 hover:bg-green-500/20">
            Completed
          </Badge>
        );
      case "IN_PROGRESS":
        return (
          <Badge variant="outline" className="text-blue-500">
            In Progress
          </Badge>
        );
      case "ABANDONED":
        return (
          <Badge variant="outline" className="text-muted-foreground">
            Abandoned
          </Badge>
        );
      default:
        return null;
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const allRoles = getAllRoles();

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button variant="ghost" asChild className="mb-4">
            <Link href="/dashboard">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Link>
          </Button>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl md:text-4xl font-bold mb-2"
          >
            Interview History 📚
          </motion.h1>
          <p className="text-muted-foreground">
            Review your past interview sessions and track progress
          </p>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by role..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Status Filter */}
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                  <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                  <SelectItem value="ABANDONED">Abandoned</SelectItem>
                </SelectContent>
              </Select>

              {/* Role Filter */}
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  {allRoles.map((role) => (
                    <SelectItem key={role.id} value={role.id}>
                      {role.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Active filters summary */}
            {(statusFilter !== "all" || roleFilter !== "all" || searchQuery) && (
              <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                <span>Showing {filteredInterviews.length} of {interviews.length} interviews</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setStatusFilter("all");
                    setRoleFilter("all");
                    setSearchQuery("");
                  }}
                >
                  Clear filters
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Interviews List */}
        {filteredInterviews.length > 0 ? (
          <div className="grid grid-cols-1 gap-4">
            {filteredInterviews.map((interview, index) => {
              const roleConfig = getRoleConfig(interview.roleId);
              const Icon = roleConfig?.icon;
              
              return (
                <motion.div
                  key={interview.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="hover:shadow-lg transition-all duration-300">
                    <CardContent className="p-6">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        {/* Left side - Role info */}
                        <div className="flex items-start gap-4">
                          {Icon && (
                            <div className={`p-3 rounded-lg ${roleConfig.bgColor} flex-shrink-0`}>
                              <Icon className={`h-6 w-6 ${roleConfig.color}`} />
                            </div>
                          )}
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg mb-1">
                              {roleConfig?.title || interview.roleId}
                            </h3>
                            <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {new Date(interview.startedAt).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric'
                                })}
                              </div>
                              {interview.durationMinutes && (
                                <div className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {interview.durationMinutes} min
                                </div>
                              )}
                              <div className="flex items-center gap-1">
                                <MessageSquare className="h-3 w-3" />
                                {interview._count.messages} messages
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Right side - Stats and actions */}
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-3">
                            {interview.status === "COMPLETED" && interview.overallScore && (
                              <div className="text-center">
                                <div className="flex items-center gap-1 text-sm text-muted-foreground mb-1">
                                  <TrendingUp className="h-3 w-3" />
                                  Score
                                </div>
                                <Badge variant="secondary" className="font-mono text-lg">
                                  {interview.overallScore.toFixed(1)}/10
                                </Badge>
                              </div>
                            )}
                            <div className="flex flex-col items-end gap-2">
                              {getStatusBadge(interview.status)}
                              <Button variant="outline" size="sm" asChild>
                                <Link href={`/interview/${interview.id}`}>
                                  View Details
                                </Link>
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No interviews found</h3>
                <p className="text-muted-foreground mb-6">
                  {interviews.length === 0 
                    ? "Start your first interview to see it here"
                    : "Try adjusting your filters"
                  }
                </p>
                {interviews.length === 0 && (
                  <Button asChild>
                    <Link href="/#positions">Start Interview</Link>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </main>
      <Footer />
    </div>
  );
}
