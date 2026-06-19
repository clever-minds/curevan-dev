'use client';

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/auth-context";
import { getTherapistById } from "@/lib/repos/therapists";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import serverApi from "@/lib/repos/axios.server";
import { getToken } from "@/lib/auth";

export default function TherapistEditProfile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    bio: '',
    qualification: '',
    experienceYears: 0,
    documents: [] as string[]
  });

  const [newDocumentUrl, setNewDocumentUrl] = useState('');

  useEffect(() => {
    async function loadProfile() {
      if (!user) return;
      try {
        const profile = await getTherapistById(user.id);
        if (profile) {
          setFormData({
            bio: profile.bio || '',
            qualification: profile.qualifications || '',
            experienceYears: profile.experience_years || 0,
            documents: profile.documents || []
          });
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddDocument = () => {
    if (!newDocumentUrl.trim()) return;
    setFormData(prev => ({ ...prev, documents: [...prev.documents, newDocumentUrl.trim()] }));
    setNewDocumentUrl('');
  };

  const handleRemoveDocument = (index: number) => {
    setFormData(prev => ({
      ...prev,
      documents: prev.documents.filter((_, i) => i !== index)
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = await getToken();
      await serverApi.put(`/api/therapists/profile/${user?.id}`, {
        bio: formData.bio,
        qualification: formData.qualification,
        experienceYears: Number(formData.experienceYears),
        documents: formData.documents
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast({ title: "Profile saved", description: "Your details have been updated." });
    } catch (err) {
      console.error(err);
      toast({ title: "Error", description: "Failed to update profile.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Skeleton className="w-full h-[600px]" />;

  return (
    <div className="space-y-6 max-w-4xl mx-auto py-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Edit Profile & Documents</h1>
        <p className="text-muted-foreground">Manage your experience details and uploaded certificates.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Experience Details</CardTitle>
            <CardDescription>Tell patients about your background.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea 
                id="bio" 
                name="bio" 
                value={formData.bio} 
                onChange={handleChange} 
                placeholder="Write a short bio..."
                className="min-h-[120px]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="qualification">Qualifications</Label>
              <Input 
                id="qualification" 
                name="qualification" 
                value={formData.qualification} 
                onChange={handleChange} 
                placeholder="e.g. MPT (Ortho), BPT" 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="experienceYears">Years of Experience</Label>
              <Input 
                id="experienceYears" 
                name="experienceYears" 
                type="number" 
                value={formData.experienceYears} 
                onChange={handleChange} 
                min="0"
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={handleSave} disabled={saving} className="w-full">
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Documents & Licenses</CardTitle>
            <CardDescription>Upload URLs for your medical licenses and ID proofs.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex space-x-2">
              <Input 
                placeholder="Enter Document URL..." 
                value={newDocumentUrl}
                onChange={(e) => setNewDocumentUrl(e.target.value)}
              />
              <Button type="button" onClick={handleAddDocument}>Add</Button>
            </div>
            
            <div className="space-y-2 mt-4">
              {formData.documents.map((doc, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-md bg-muted/50">
                  <a href={doc} target="_blank" rel="noreferrer" className="text-sm text-blue-600 truncate max-w-[250px] hover:underline">
                    {doc}
                  </a>
                  <Button variant="destructive" size="sm" onClick={() => handleRemoveDocument(index)}>Remove</Button>
                </div>
              ))}
              {formData.documents.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">No documents uploaded yet.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
