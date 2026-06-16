'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Trash2 } from "lucide-react";
import clientApi from '@/lib/repos/axios';

interface ServiceType {
  id: number;
  name: string;
  is_active: boolean;
  created_at: string;
}

export default function AdminServiceTypesPage() {
  const { toast } = useToast();
  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newTypeName, setNewTypeName] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    fetchServiceTypes();
  }, []);

  const fetchServiceTypes = async () => {
    try {
      setIsLoading(true);
      const { data } = await clientApi.get('/api/service-types/list');
      if (data?.success) {
        setServiceTypes(data.data || []);
      } else {
        toast({ title: "Error", description: data?.message || "Failed to fetch service types", variant: "destructive" });
      }
    } catch (error) {
      console.error("Fetch service types error:", error);
      toast({ title: "Error", description: "Failed to connect to server.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddServiceType = async () => {
    if (!newTypeName.trim()) return;
    
    try {
      setIsAdding(true);
      const { data } = await clientApi.post('/api/service-types/add', { name: newTypeName.trim() });
      if (data?.success) {
        toast({ title: "Success", description: "Service type added successfully" });
        setNewTypeName("");
        fetchServiceTypes();
      } else {
        toast({ title: "Error", description: data?.message || "Failed to add service type", variant: "destructive" });
      }
    } catch (error: any) {
       toast({ title: "Error", description: error?.response?.data?.message || "Failed to connect to server.", variant: "destructive" });
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeleteServiceType = async (id: number) => {
    if (!confirm("Are you sure you want to delete this service type?")) return;
    
    try {
      const { data } = await clientApi.delete(`/api/service-types/delete/${id}`);
      if (data?.success) {
        toast({ title: "Success", description: "Service type deleted successfully" });
        fetchServiceTypes();
      } else {
        toast({ title: "Error", description: data?.message || "Failed to delete service type", variant: "destructive" });
      }
    } catch (error: any) {
      toast({ title: "Error", description: error?.response?.data?.message || "Failed to connect to server.", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight font-headline">Service Types</h1>
        <p className="text-muted-foreground">Manage the types of therapy services available on the platform.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Add New Service Type</CardTitle>
          <CardDescription>Enter the name of the new service type.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-start gap-4">
            <div className="w-full sm:max-w-sm">
                <Input 
                  placeholder="e.g. Acupuncture" 
                  value={newTypeName} 
                  onChange={(e) => setNewTypeName(e.target.value)} 
                  onKeyDown={(e) => e.key === 'Enter' && handleAddServiceType()}
                />
            </div>
            <Button onClick={handleAddServiceType} disabled={isAdding || !newTypeName.trim()} className="shrink-0">
              {isAdding ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
              Add
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Existing Service Types</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {serviceTypes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
                      No service types found.
                    </TableCell>
                  </TableRow>
                ) : (
                  serviceTypes.map((st) => (
                    <TableRow key={st.id}>
                      <TableCell>{st.id}</TableCell>
                      <TableCell className="font-medium">{st.name}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs ${st.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                          {st.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleDeleteServiceType(st.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
