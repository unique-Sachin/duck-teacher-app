"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useSessionStore, type DuckPersona } from "@/src/stores/session";

interface InitialSetupModalProps {
  isOpen: boolean;
  onComplete: () => void;
}

export function InitialSetupModal({ isOpen, onComplete }: InitialSetupModalProps) {
  const { email, persona, topic, setEmail, setPersona, setTopic } = useSessionStore();
  const [tempEmail, setTempEmail] = useState(email);
  const [tempPersona, setTempPersona] = useState<DuckPersona>(persona);
  const [tempTopic, setTempTopic] = useState(topic);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!tempEmail.trim() || !tempTopic.trim()) {
      return; // Don't submit if email or topic is empty
    }

    // Update the store with the values
    setEmail(tempEmail);
    setPersona(tempPersona);
    setTopic(tempTopic);
    
    // Close modal
    onComplete();
  };

  const isValid = tempEmail.trim().length > 0 && tempTopic.trim().length > 0;

  return (
    <Dialog open={isOpen} onOpenChange={() => {}} >
      <DialogContent className="sm:max-w-[600px] overflow-visible" style={{ zIndex: 150 }}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            🦆 Welcome to Duck Teacher
          </DialogTitle>
          <DialogDescription>
            Let&apos;s set up your learning session. Choose your email, topic, and duck teacher persona to get started.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6 pt-4 overflow-visible">
          {/* Email Input */}
          <div className="space-y-2">
            <Label htmlFor="setup-email">Your Email</Label>
            <Input
              id="setup-email"
              type="email"
              placeholder="your.email@example.com"
              value={tempEmail}
              onChange={(e) => setTempEmail(e.target.value)}
              required
              autoFocus
            />
          </div>

          {/* Topic Input */}
          <div className="space-y-2">
            <Label htmlFor="setup-topic">What topic will you teach?</Label>
            <Input
              id="setup-topic"
              type="text"
              placeholder="e.g., Math equations, React hooks, Spanish verbs..."
              value={tempTopic}
              onChange={(e) => setTempTopic(e.target.value)}
              required
            />
          </div>

          {/* Persona Select */}
          <div className="space-y-2 overflow-visible">
            <Label htmlFor="setup-persona">Choose Your Duck Teacher</Label>
            <Select value={tempPersona} onValueChange={(value: string) => setTempPersona(value as DuckPersona)}>
              <SelectTrigger>
                <SelectValue placeholder="Select a duck persona" />
              </SelectTrigger>
              <SelectContent 
                style={{ zIndex: 99999 }}
                className="bg-white border border-gray-200 shadow-xl" 
                position="popper" 
                sideOffset={8}
                alignOffset={0}
                avoidCollisions={true}
                sticky="always"
              >
                <SelectItem value="student">🎓 Student Duck - Learn with guidance</SelectItem>
                <SelectItem value="interviewer">💼 Interviewer Duck - Practice interviews</SelectItem>
                <SelectItem value="peer">👥 Peer Duck - Collaborative learning</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Instructions */}
          <div className="bg-muted p-4 rounded-lg text-sm mt-4">
            <div className="font-medium mb-2">What happens next:</div>
            <ul className="space-y-1 text-muted-foreground">
              <li>• Draw or write about your topic on the whiteboard</li>
              <li>• Record your explanation using the mic</li>
              <li>• Send to your duck teacher for personalized feedback</li>
            </ul>
          </div>

          {/* Submit Button */}
          <Button 
            type="submit" 
            className="w-full" 
            size="lg"
            disabled={!isValid}
          >
            Enter Session 🚀
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
