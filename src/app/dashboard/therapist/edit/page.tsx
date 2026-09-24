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
import MediaPicker from "@/components/MediaPicker";

export default function TherapistEditProfile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fullProfile, setFullProfile] = useState<any>(null);

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
          setFullProfile(profile);
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
      await serverApi.post(`/api/auth/change-profile-request`, {
        email: fullProfile?.email,
        fullName: fullProfile?.name,
        mobile: fullProfile?.phone,
        line1: fullProfile?.address_line1,
        line2: fullProfile?.address_line2,
        city: fullProfile?.city,
        state: fullProfile?.state,
        pin: fullProfile?.pin,
        fullAddress: fullProfile?.fullAddress || fullProfile?.full_address,
        lat: fullProfile?.lat || fullProfile?.latitude,
        lng: fullProfile?.lng || fullProfile?.longitude,
        
        bio: formData.bio,
        qualification: formData.qualification,
        qualifications: formData.qualification,
        experienceYears: Number(formData.experienceYears),
        experience: Number(formData.experienceYears),
        
        hourlyRate: fullProfile?.hourly_rate,
        membershipPlan: fullProfile?.membership_plan,
        panNumber: fullProfile?.pan_number,
        registrationNo: fullProfile?.registration_no,
        bankAccountNumber: fullProfile?.bank_account_number,
        bankIfscCode: fullProfile?.bank_ifsc_code,
        serviceRadiusKm: fullProfile?.service_radius_km,
        specialty: fullProfile?.specialty,
        documents: formData.documents,
        
        section: "Therapist Profile",
        role: "therapist",
        userId: user?.id
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast({ title: "Profile update requested", description: "Your changes have been submitted for admin approval." });
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
            <div className="mt-4">
              <MediaPicker 
                multiple={true}
                value={formData.documents.map(d => ({ id: d, url: d, type: 'image' })) as any[]}
                onChange={(media) => setFormData(prev => ({ ...prev, documents: media.map(m => m.url) }))}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
