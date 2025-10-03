"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import { Clock, ArrowRight } from "lucide-react";
import { getAllRoles } from "@/src/config/roles";

export default function MarketingHome() {
  const interviewPositions = getAllRoles();
  
  return (
     <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <div className="container mx-auto px-4 py-16 md:py-24">
          {/* Hero Section */}
      <div className="flex flex-col items-center justify-center text-center space-y-8 max-w-6xl mx-auto">
        {/* Animated Heading */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="w-full"
        >
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
            AI-Powered{" "}
            <span className="text-primary">Mock Interviews</span> 🦆
          </h1>
        </motion.div>

        {/* Animated Subheading */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
          className="w-full"
        >
          <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
            Practice technical interviews with AI feedback. 
            Choose your role and start preparing for your dream job!
          </p>
        </motion.div>

        {/* Interview Positions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut", delay: 0.4 }}
          className="w-full max-w-5xl mx-auto mt-12"
          id="positions"
        >
          <h2 className="text-2xl font-semibold mb-8 text-center">
            Choose Your Interview Position
          </h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            {interviewPositions.map((position, index) => {
              const Icon = position.icon;
              return (
                <motion.div
                  key={position.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.5 + index * 0.1 }}
                >
                  <Card className={`h-full hover:shadow-lg transition-all duration-300 border-2 ${position.borderColor} hover:scale-[1.02]`}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className={`p-3 rounded-lg ${position.bgColor} mb-4`}>
                          <Icon className={`h-8 w-8 ${position.color}`} />
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {position.difficulty}
                        </Badge>
                      </div>
                      <CardTitle className="text-2xl">{position.title}</CardTitle>
                      <CardDescription className="text-base mt-2">
                        {position.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>{position.duration}</span>
                      </div>
                      
                      <div className="flex flex-wrap gap-2">
                        {position.topics.map((topic) => (
                          <Badge key={topic} variant="outline" className="text-xs">
                            {topic}
                          </Badge>
                        ))}
                      </div>

                      <Button 
                        asChild 
                        className="w-full mt-4"
                        size="lg"
                      >
                        <Link 
                          href={`/interview/${position.id}`}
                          className="flex items-center justify-center gap-2"
                        >
                          Start Interview
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Feature Cards */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.8 }}
          className="grid md:grid-cols-3 gap-6 w-full max-w-5xl mx-auto mt-16"
        >
          <div className="bg-card border rounded-lg p-6 text-center">
            <div className="text-3xl mb-4">🎯</div>
            <h3 className="font-semibold mb-2">Real Interview Questions</h3>
            <p className="text-sm text-muted-foreground">
              Practice with actual questions asked by top tech companies
            </p>
          </div>
          <div className="bg-card border rounded-lg p-6 text-center">
            <div className="text-3xl mb-4">🧠</div>
            <h3 className="font-semibold mb-2">AI-Powered Feedback</h3>
            <p className="text-sm text-muted-foreground">
              Get professional interview feedback powered by advanced AI
            </p>
          </div>
          <div className="bg-card border rounded-lg p-6 text-center">
            <div className="text-3xl mb-4">📈</div>
            <h3 className="font-semibold mb-2">Track Performance</h3>
            <p className="text-sm text-muted-foreground">
              Monitor your interview skills with detailed performance analytics
            </p>
          </div>
        </motion.div>

        {/* Additional Animated Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, ease: "easeOut", delay: 1 }}
          className="bg-primary/5 border border-primary/20 rounded-lg p-8 w-full max-w-4xl mx-auto mt-16"
        >
          <div className="text-center">
            <h2 className="text-2xl font-semibold mb-4">
              Ready to ace your next interview?
            </h2>
            <p className="text-muted-foreground mb-6">
              Join professionals who are using AI Mock Interviews to improve their technical interview skills and land their dream jobs.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild variant="default">
                <Link href="/interview/system-design">
                  Try System Design Interview
                </Link>
              </Button>
              <Button size="lg" asChild variant="outline">
                <Link href="/interview/genai-developer">
                  Try Gen AI Interview
                </Link>
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
    </main>
      <Footer />
    </div>
  );
}
