"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";

export default function MarketingHome() {
  return (
     <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <div className="container mx-auto py-16 md:py-24">
          {/* Hero Section */}
      <div className="flex flex-col items-center justify-center text-center space-y-8 max-w-4xl mx-auto">
        {/* Animated Heading */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="w-full"
        >
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
            Learn with{" "}
            <span className="text-primary">Duck</span> 🦆
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
            Your AI-powered learning companion that makes education 
            engaging, personalized, and fun. Start your learning journey today!
          </p>
        </motion.div>

        {/* Animated CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut", delay: 0.4 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          {/* <Button size="lg" asChild variant="outline"> */}
            <Link href="/session" as='button'>
              Start Learning Session 🚀
            </Link>
          {/* </Button> */}
        </motion.div>

        {/* Animated Feature Cards */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.6 }}
          className="grid md:grid-cols-3 gap-6 w-full max-w-5xl mx-auto mt-16"
        >
          <div className="bg-card border rounded-lg p-6 text-center">
            <div className="text-3xl mb-4">🎯</div>
            <h3 className="font-semibold mb-2">Personalized Learning</h3>
            <p className="text-sm text-muted-foreground">
              Adaptive content that adjusts to your learning pace and style
            </p>
          </div>
          <div className="bg-card border rounded-lg p-6 text-center">
            <div className="text-3xl mb-4">🧠</div>
            <h3 className="font-semibold mb-2">AI-Powered</h3>
            <p className="text-sm text-muted-foreground">
              Advanced AI technology to provide intelligent tutoring and feedback
            </p>
          </div>
          <div className="bg-card border rounded-lg p-6 text-center">
            <div className="text-3xl mb-4">📈</div>
            <h3 className="font-semibold mb-2">Track Progress</h3>
            <p className="text-sm text-muted-foreground">
              Monitor your learning journey with detailed analytics and insights
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
              Ready to transform your learning experience?
            </h2>
            <p className="text-muted-foreground mb-6">
              Join thousands of learners who are already using Duck Teacher to achieve their goals.
            </p>
            <Button size="lg" asChild>
              <Link href="/session">
                Get Started Now 🦆
              </Link>
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
    </main>
      <Footer />
    </div>
  );
}
