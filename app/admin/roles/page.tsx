'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ArrowLeft, Plus, Edit, Briefcase, Clock, BarChart3, Tag } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

interface InterviewRole {
  id: string;
  title: string;
  description: string;
  duration: string;
  difficulty: string;
  topics: string[];
  isActive: boolean;
}

export default function RolesManagement() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [roles, setRoles] = useState<InterviewRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<InterviewRole | null>(null);
  const [formData, setFormData] = useState({
    id: '',
    title: '',
    description: '',
    duration: '45-60 min',
    difficulty: 'Intermediate',
    topics: '',
  });

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role !== 'ADMIN') {
      router.push('/dashboard');
    } else if (status === 'authenticated') {
      fetchRoles();
    }
  }, [session, status, router]);

  const fetchRoles = async () => {
    try {
      const response = await fetch('/api/admin/roles');
      if (response.ok) {
        const data = await response.json();
        setRoles(data);
      } else {
        toast.error('Failed to fetch roles');
      }
    } catch (error) {
      toast.error('Error fetching roles');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (role?: InterviewRole) => {
    if (role) {
      setEditingRole(role);
      setFormData({
        id: role.id,
        title: role.title,
        description: role.description,
        duration: role.duration,
        difficulty: role.difficulty,
        topics: role.topics.join(', '),
      });
    } else {
      setEditingRole(null);
      setFormData({
        id: '',
        title: '',
        description: '',
        duration: '45-60 min',
        difficulty: 'Intermediate',
        topics: '',
      });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const topicsArray = formData.topics.split(',').map(t => t.trim()).filter(t => t);
    
    try {
      const url = '/api/admin/roles';
      const method = editingRole ? 'PATCH' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: formData.id,
          title: formData.title,
          description: formData.description,
          duration: formData.duration,
          difficulty: formData.difficulty,
          topics: topicsArray,
        }),
      });

      if (response.ok) {
        toast.success(editingRole ? 'Role updated successfully' : 'Role created successfully');
        setIsDialogOpen(false);
        fetchRoles();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to save role');
      }
    } catch (error) {
      toast.error('Error saving role');
      console.error(error);
    }
  };

  const toggleRoleStatus = async (roleId: string, currentStatus: boolean) => {
    try {
      const response = await fetch('/api/admin/roles', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: roleId,
          isActive: !currentStatus,
        }),
      });

      if (response.ok) {
        toast.success(`Role ${!currentStatus ? 'activated' : 'deactivated'}`);
        fetchRoles();
      } else {
        toast.error('Failed to update role status');
      }
    } catch (error) {
      toast.error('Error updating role status');
      console.error(error);
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
        
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Briefcase className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-bold">Interview Roles</h1>
            </div>
            <p className="text-muted-foreground">
              Manage interview role types and configurations
            </p>
          </div>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="h-4 w-4 mr-2" />
            Add Role
          </Button>
        </div>
      </div>

      {/* Roles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {roles.map((role) => (
          <Card key={role.id} className={!role.isActive ? 'opacity-60' : ''}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="flex items-center gap-2">
                    {role.title}
                    {!role.isActive && (
                      <Badge variant="secondary">Inactive</Badge>
                    )}
                  </CardTitle>
                  <CardDescription className="mt-2">
                    {role.description}
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleOpenDialog(role)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>Duration: {role.duration}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <BarChart3 className="h-4 w-4" />
                  <span>Difficulty: {role.difficulty}</span>
                </div>
                <div className="flex items-start gap-2 text-sm">
                  <Tag className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <div className="flex flex-wrap gap-1">
                    {role.topics.map((topic, idx) => (
                      <Badge key={idx} variant="outline">
                        {topic}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push(`/admin/questions?roleId=${role.id}`)}
                  className="flex-1"
                >
                  View Questions
                </Button>
                <Button
                  variant={role.isActive ? 'outline' : 'default'}
                  size="sm"
                  onClick={() => toggleRoleStatus(role.id, role.isActive)}
                >
                  {role.isActive ? 'Deactivate' : 'Activate'}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingRole ? 'Edit Role' : 'Create New Role'}
            </DialogTitle>
            <DialogDescription>
              {editingRole
                ? 'Update the role information below'
                : 'Add a new interview role to the system'}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="id">Role ID</Label>
                <Input
                  id="id"
                  placeholder="e.g., backend-engineer"
                  value={formData.id}
                  onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                  disabled={!!editingRole}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Use lowercase with hyphens (e.g., backend-engineer)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  placeholder="e.g., Backend Engineer"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe the interview role..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="duration">Duration</Label>
                  <Input
                    id="duration"
                    placeholder="e.g., 45-60 min"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="difficulty">Difficulty</Label>
                  <Input
                    id="difficulty"
                    placeholder="e.g., Intermediate"
                    value={formData.difficulty}
                    onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="topics">Topics (comma-separated)</Label>
                <Textarea
                  id="topics"
                  placeholder="e.g., Node.js, APIs, Databases, Authentication"
                  value={formData.topics}
                  onChange={(e) => setFormData({ ...formData, topics: e.target.value })}
                  rows={2}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Separate topics with commas
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {editingRole ? 'Update Role' : 'Create Role'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
