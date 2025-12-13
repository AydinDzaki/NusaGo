import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import type { Submission, UserProfile } from "../lib/supabase";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Shield, UserPlus, CheckCircle, XCircle, Clock, Trash2, Edit, Plus, MapPin } from "./icons";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { toast } from "sonner";
import { ScrollArea } from "./ui/scroll-area";

interface AdminDashboardProps {
  currentUser: { id: string; name: string; email: string; role: string };
  onBack: () => void;
}

export function AdminDashboard({ currentUser, onBack }: AdminDashboardProps) {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [eventOrganizers, setEventOrganizers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  
  // Add EO form
  const [addEOEmail, setAddEOEmail] = useState("");
  const [addEODialogOpen, setAddEODialogOpen] = useState(false);

  useEffect(() => {
    fetchSubmissions();
    fetchEventOrganizers();
  }, []);

  const fetchSubmissions = async () => {
    try {
      const { data, error } = await supabase
        .from('submissions')
        .select(`
          *,
          submitted_by_profile:user_profiles!submitted_by(name, email),
          reviewed_by_profile:user_profiles!reviewed_by(name, email)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSubmissions(data || []);
    } catch (error) {
      console.error('Error fetching submissions:', error);
      toast.error('Gagal memuat submissions');
    } finally {
      setLoading(false);
    }
  };

  const fetchEventOrganizers = async () => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('role', 'event_organizer')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEventOrganizers(data || []);
    } catch (error) {
      console.error('Error fetching EOs:', error);
    }
  };

  const handleApproveSubmission = async (submission: Submission) => {
    try {
      // Update submission status
      const { error: updateError } = await supabase
        .from('submissions')
        .update({
          status: 'approved',
          reviewed_at: new Date().toISOString(),
          reviewed_by: currentUser.id,
          review_notes: reviewNotes
        })
        .eq('id', submission.id);

      if (updateError) throw updateError;

      // Process based on submission type
      if (submission.type === 'add') {
        // Add new destination
        const { error: insertError } = await supabase
          .from('destinations')
          .insert({
            ...submission.data,
            created_by: submission.submitted_by
          });
        
        if (insertError) throw insertError;
      } else if (submission.type === 'edit' && submission.destination_id) {
        // Update existing destination
        const { error: updateDestError } = await supabase
          .from('destinations')
          .update(submission.data)
          .eq('id', submission.destination_id);
        
        if (updateDestError) throw updateDestError;
      } else if (submission.type === 'delete' && submission.destination_id) {
        // Delete destination
        const { error: deleteError } = await supabase
          .from('destinations')
          .delete()
          .eq('id', submission.destination_id);
        
        if (deleteError) throw deleteError;
      }

      toast.success('Submission berhasil disetujui');
      setSelectedSubmission(null);
      setReviewNotes("");
      fetchSubmissions();
    } catch (error) {
      console.error('Error approving submission:', error);
      toast.error('Gagal menyetujui submission');
    }
  };

  const handleRejectSubmission = async (submission: Submission) => {
    try {
      const { error } = await supabase
        .from('submissions')
        .update({
          status: 'rejected',
          reviewed_at: new Date().toISOString(),
          reviewed_by: currentUser.id,
          review_notes: reviewNotes
        })
        .eq('id', submission.id);

      if (error) throw error;

      toast.success('Submission berhasil ditolak');
      setSelectedSubmission(null);
      setReviewNotes("");
      fetchSubmissions();
    } catch (error) {
      console.error('Error rejecting submission:', error);
      toast.error('Gagal menolak submission');
    }
  };

  const handleAddEventOrganizer = async () => {
    try {
      // Find user by email
      const { data: userData, error: userError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('email', addEOEmail)
        .single();

      if (userError) {
        toast.error('User dengan email tersebut tidak ditemukan');
        return;
      }

      // Update role to event_organizer
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({ role: 'event_organizer' })
        .eq('id', userData.id);

      if (updateError) throw updateError;

      toast.success(`${userData.name} berhasil dijadikan Event Organizer`);
      setAddEOEmail("");
      setAddEODialogOpen(false);
      fetchEventOrganizers();
    } catch (error) {
      console.error('Error adding EO:', error);
      toast.error('Gagal menambahkan Event Organizer');
    }
  };

  const handleRemoveEO = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ role: 'user' })
        .eq('id', userId);

      if (error) throw error;

      toast.success('Event Organizer berhasil dihapus');
      fetchEventOrganizers();
    } catch (error) {
      console.error('Error removing EO:', error);
      toast.error('Gagal menghapus Event Organizer');
    }
  };

  const getSubmissionBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="gap-1"><Clock className="h-3 w-3" /> Pending</Badge>;
      case 'approved':
        return <Badge variant="default" className="gap-1 bg-green-500"><CheckCircle className="h-3 w-3" /> Disetujui</Badge>;
      case 'rejected':
        return <Badge variant="destructive" className="gap-1"><XCircle className="h-3 w-3" /> Ditolak</Badge>;
      default:
        return null;
    }
  };

  const getSubmissionIcon = (type: string) => {
    switch (type) {
      case 'add':
        return <Plus className="h-4 w-4 text-green-500" />;
      case 'edit':
        return <Edit className="h-4 w-4 text-blue-500" />;
      case 'delete':
        return <Trash2 className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  const pendingSubmissions = submissions.filter(s => s.status === 'pending');
  const reviewedSubmissions = submissions.filter(s => s.status !== 'pending');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl">Admin Dashboard</h1>
              <p className="text-muted-foreground">Kelola submissions dan Event Organizers</p>
            </div>
          </div>
          <Button variant="outline" onClick={onBack}>
            ← Kembali ke Beranda
          </Button>
        </div>

        <Tabs defaultValue="submissions" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="submissions">
              Submissions {pendingSubmissions.length > 0 && (
                <Badge variant="destructive" className="ml-2">{pendingSubmissions.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="event-organizers">Event Organizers</TabsTrigger>
          </TabsList>

          {/* Submissions Tab */}
          <TabsContent value="submissions" className="space-y-4">
            {/* Pending Submissions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Pending Submissions ({pendingSubmissions.length})
                </CardTitle>
                <CardDescription>
                  Submissions yang menunggu persetujuan Anda
                </CardDescription>
              </CardHeader>
              <CardContent>
                {pendingSubmissions.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Tidak ada submission pending
                  </div>
                ) : (
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-3">
                      {pendingSubmissions.map((submission) => (
                        <Card key={submission.id} className="border-l-4 border-l-orange-500">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1 space-y-2">
                                <div className="flex items-center gap-2">
                                  {getSubmissionIcon(submission.type)}
                                  <span className="font-medium capitalize">{submission.type}</span>
                                  {getSubmissionBadge(submission.status)}
                                </div>
                                
                                <div className="text-sm space-y-1">
                                  <p className="text-muted-foreground">
                                    Dari: {(submission as any).submitted_by_profile?.name || 'Unknown'}
                                  </p>
                                  <p>
                                    <strong>Nama:</strong> {submission.data.name || 'N/A'}
                                  </p>
                                  <p>
                                    <strong>Lokasi:</strong> {submission.data.location || 'N/A'}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    Dibuat: {new Date(submission.created_at).toLocaleString('id-ID')}
                                  </p>
                                </div>
                              </div>

                              <div className="flex gap-2">
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button 
                                      size="sm" 
                                      onClick={() => setSelectedSubmission(submission)}
                                    >
                                      Review
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                                    <DialogHeader>
                                      <DialogTitle className="flex items-center gap-2">
                                        {getSubmissionIcon(submission.type)}
                                        Review Submission - {submission.type.toUpperCase()}
                                      </DialogTitle>
                                      <DialogDescription>
                                        Dari: {(submission as any).submitted_by_profile?.name}
                                      </DialogDescription>
                                    </DialogHeader>

                                    <div className="space-y-4">
                                      {/* Submission Data Preview */}
                                      <div className="bg-muted p-4 rounded-lg space-y-2">
                                        <h3 className="font-medium">Data Submission:</h3>
                                        <div className="grid grid-cols-2 gap-3 text-sm">
                                          <div>
                                            <p className="text-muted-foreground">Nama</p>
                                            <p>{submission.data.name}</p>
                                          </div>
                                          <div>
                                            <p className="text-muted-foreground">Lokasi</p>
                                            <p>{submission.data.location}</p>
                                          </div>
                                          <div>
                                            <p className="text-muted-foreground">Tipe</p>
                                            <p className="capitalize">{submission.data.type}</p>
                                          </div>
                                          <div>
                                            <p className="text-muted-foreground">Tags</p>
                                            <p>{submission.data.tags?.join(', ') || '-'}</p>
                                          </div>
                                          {submission.data.price && (
                                            <div>
                                              <p className="text-muted-foreground">Harga</p>
                                              <p>{submission.data.price}</p>
                                            </div>
                                          )}
                                        </div>
                                        <div>
                                          <p className="text-muted-foreground">Deskripsi</p>
                                          <p className="text-sm mt-1">{submission.data.description}</p>
                                        </div>
                                        {submission.data.image && (
                                          <div>
                                            <p className="text-muted-foreground mb-2">Gambar</p>
                                            <img 
                                              src={submission.data.image} 
                                              alt={submission.data.name}
                                              className="w-full h-48 object-cover rounded-lg"
                                            />
                                          </div>
                                        )}
                                      </div>

                                      <div className="space-y-2">
                                        <Label htmlFor="review-notes">Catatan Review (opsional)</Label>
                                        <Textarea
                                          id="review-notes"
                                          placeholder="Tambahkan catatan untuk EO..."
                                          value={reviewNotes}
                                          onChange={(e) => setReviewNotes(e.target.value)}
                                          rows={3}
                                        />
                                      </div>
                                    </div>

                                    <DialogFooter className="gap-2">
                                      <Button
                                        variant="destructive"
                                        onClick={() => handleRejectSubmission(submission)}
                                        className="gap-2"
                                      >
                                        <XCircle className="h-4 w-4" />
                                        Tolak
                                      </Button>
                                      <Button
                                        onClick={() => handleApproveSubmission(submission)}
                                        className="gap-2 bg-green-500 hover:bg-green-600"
                                      >
                                        <CheckCircle className="h-4 w-4" />
                                        Setujui
                                      </Button>
                                    </DialogFooter>
                                  </DialogContent>
                                </Dialog>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>

            {/* Reviewed Submissions */}
            <Card>
              <CardHeader>
                <CardTitle>Riwayat Review</CardTitle>
                <CardDescription>
                  Submissions yang sudah direview
                </CardDescription>
              </CardHeader>
              <CardContent>
                {reviewedSubmissions.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Belum ada submission yang direview
                  </div>
                ) : (
                  <ScrollArea className="h-[300px]">
                    <div className="space-y-2">
                      {reviewedSubmissions.map((submission) => (
                        <div key={submission.id} className="flex items-center justify-between p-3 bg-muted rounded-lg text-sm">
                          <div className="flex items-center gap-3">
                            {getSubmissionIcon(submission.type)}
                            <div>
                              <p className="font-medium">{submission.data.name}</p>
                              <p className="text-xs text-muted-foreground">
                                Dari: {(submission as any).submitted_by_profile?.name}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-right text-xs">
                              <p className="text-muted-foreground">
                                {submission.reviewed_at && new Date(submission.reviewed_at).toLocaleDateString('id-ID')}
                              </p>
                              <p className="text-muted-foreground">
                                oleh {(submission as any).reviewed_by_profile?.name || 'Admin'}
                              </p>
                            </div>
                            {getSubmissionBadge(submission.status)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Event Organizers Tab */}
          <TabsContent value="event-organizers" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Event Organizers ({eventOrganizers.length})</CardTitle>
                    <CardDescription>
                      Kelola akun Event Organizer
                    </CardDescription>
                  </div>
                  <Dialog open={addEODialogOpen} onOpenChange={setAddEODialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="gap-2">
                        <UserPlus className="h-4 w-4" />
                        Tambah EO
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Tambah Event Organizer</DialogTitle>
                        <DialogDescription>
                          Masukkan email user yang ingin dijadikan Event Organizer
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="eo-email">Email User</Label>
                          <Input
                            id="eo-email"
                            type="email"
                            placeholder="user@example.com"
                            value={addEOEmail}
                            onChange={(e) => setAddEOEmail(e.target.value)}
                          />
                          <p className="text-xs text-muted-foreground">
                            User harus sudah terdaftar di NusaGo
                          </p>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button
                          onClick={handleAddEventOrganizer}
                          disabled={!addEOEmail}
                        >
                          Tambahkan
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                {eventOrganizers.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Belum ada Event Organizer
                  </div>
                ) : (
                  <div className="space-y-2">
                    {eventOrganizers.map((eo) => (
                      <Card key={eo.id}>
                        <CardContent className="flex items-center justify-between p-4">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <UserPlus className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium">{eo.name}</p>
                              <p className="text-sm text-muted-foreground">{eo.email}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary">Event Organizer</Badge>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveEO(eo.id)}
                              className="text-destructive hover:text-destructive"
                            >
                              Hapus
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}