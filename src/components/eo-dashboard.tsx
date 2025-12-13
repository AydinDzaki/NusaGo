import { useState, useEffect } from "react";
import { Briefcase, Plus, Edit, Trash2, Clock, CheckCircle, XCircle, MapPin, Calendar, DollarSign, Tag, Image } from "./icons";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { toast } from "sonner";
import { ScrollArea } from "./ui/scroll-area";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { supabase, type Submission } from "../lib/supabase";
import { Destination } from "./destination-card";

interface EODashboardProps {
  currentUser: { id: string; name: string; email: string; role: string };
  onBack: () => void;
}

type SubmissionType = 'add' | 'edit' | 'delete';

export function EODashboard({ currentUser, onBack }: EODashboardProps) {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [currentSubmissionType, setCurrentSubmissionType] = useState<SubmissionType>('add');
  const [selectedDestination, setSelectedDestination] = useState<Destination | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    type: 'destination' as 'destination' | 'event',
    description: '',
    image: '',
    tags: [] as string[],
    coordinates: { lat: -6.2088, lng: 106.8456 }, // Default Jakarta
    price: '',
    date: '',
  });

  const [newTag, setNewTag] = useState('');

  useEffect(() => {
    fetchSubmissions();
    fetchDestinations();
  }, []);

  const fetchSubmissions = async () => {
    try {
      const { data, error } = await supabase
        .from('submissions')
        .select('*')
        .eq('submitted_by', currentUser.id)
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

  const fetchDestinations = async () => {
    try {
      const { data, error } = await supabase
        .from('destinations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDestinations(data || []);
    } catch (error) {
      console.error('Error fetching destinations:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const submissionData = {
        submitted_by: currentUser.id,
        type: currentSubmissionType,
        status: 'pending',
        destination_id: currentSubmissionType !== 'add' ? selectedDestination?.id : undefined,
        data: formData,
      };

      const { error } = await supabase
        .from('submissions')
        .insert(submissionData);

      if (error) throw error;

      toast.success('Submission berhasil dikirim untuk review');
      setFormOpen(false);
      resetForm();
      fetchSubmissions();
    } catch (error) {
      console.error('Error submitting:', error);
      toast.error('Gagal mengirim submission');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      location: '',
      type: 'destination',
      description: '',
      image: '',
      tags: [],
      coordinates: { lat: -6.2088, lng: 106.8456 },
      price: '',
      date: '',
    });
    setSelectedDestination(null);
    setNewTag('');
  };

  const openAddForm = () => {
    resetForm();
    setCurrentSubmissionType('add');
    setFormOpen(true);
  };

  const openEditForm = (destination: Destination) => {
    setSelectedDestination(destination);
    setFormData({
      name: destination.name,
      location: destination.location,
      type: destination.type,
      description: destination.description,
      image: destination.image,
      tags: destination.tags || [],
      coordinates: destination.coordinates,
      price: destination.price || '',
      date: destination.date || '',
    });
    setCurrentSubmissionType('edit');
    setFormOpen(true);
  };

  const openDeleteForm = (destination: Destination) => {
    setSelectedDestination(destination);
    setFormData({
      name: destination.name,
      location: destination.location,
      type: destination.type,
      description: destination.description,
      image: destination.image,
      tags: destination.tags || [],
      coordinates: destination.coordinates,
      price: destination.price || '',
      date: destination.date || '',
    });
    setCurrentSubmissionType('delete');
    setFormOpen(true);
  };

  const handleAddTag = () => {
    if (newTag && !formData.tags.includes(newTag)) {
      setFormData({ ...formData, tags: [...formData.tags, newTag] });
      setNewTag('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setFormData({ ...formData, tags: formData.tags.filter(t => t !== tag) });
  };

  const handleImageSearch = async () => {
    try {
      // This would use unsplash_tool but simplified for now
      toast.info('Gunakan URL gambar dari Unsplash atau sumber lain');
    } catch (error) {
      console.error('Error searching image:', error);
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

  const pendingCount = submissions.filter(s => s.status === 'pending').length;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Briefcase className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl">Event Organizer Dashboard</h1>
              <p className="text-muted-foreground">Kelola destinasi dan event Anda</p>
            </div>
          </div>
          <Button variant="outline" onClick={onBack}>
            ← Kembali ke Beranda
          </Button>
        </div>

        <Tabs defaultValue="submissions" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="submissions">
              My Submissions {pendingCount > 0 && (
                <Badge variant="secondary" className="ml-2">{pendingCount}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="destinations">Destinasi Tersedia</TabsTrigger>
          </TabsList>

          {/* Submissions Tab */}
          <TabsContent value="submissions" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Submission Saya</CardTitle>
                    <CardDescription>
                      Pantau status submission Anda
                    </CardDescription>
                  </div>
                  <Button onClick={openAddForm} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Tambah Destinasi Baru
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {submissions.length === 0 ? (
                  <div className="text-center py-12">
                    <Briefcase className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">Belum ada submission</p>
                    <Button onClick={openAddForm} className="mt-4 gap-2">
                      <Plus className="h-4 w-4" />
                      Buat Submission Pertama
                    </Button>
                  </div>
                ) : (
                  <ScrollArea className="h-[500px]">
                    <div className="space-y-3">
                      {submissions.map((submission) => (
                        <Card key={submission.id}>
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1 space-y-2">
                                <div className="flex items-center gap-2">
                                  {getSubmissionIcon(submission.type)}
                                  <span className="font-medium capitalize">{submission.type}</span>
                                  {getSubmissionBadge(submission.status)}
                                </div>
                                
                                <div className="space-y-1">
                                  <p className="font-medium">{submission.data.name}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {submission.data.location}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    Dibuat: {new Date(submission.created_at).toLocaleString('id-ID')}
                                  </p>
                                  {submission.reviewed_at && (
                                    <p className="text-xs text-muted-foreground">
                                      Direview: {new Date(submission.reviewed_at).toLocaleString('id-ID')}
                                    </p>
                                  )}
                                  {submission.review_notes && (
                                    <div className="mt-2 p-2 bg-muted rounded text-xs">
                                      <p className="font-medium">Catatan Admin:</p>
                                      <p>{submission.review_notes}</p>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {submission.data.image && (
                                <img 
                                  src={submission.data.image} 
                                  alt={submission.data.name}
                                  className="w-24 h-24 object-cover rounded-lg"
                                />
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Destinations Tab */}
          <TabsContent value="destinations" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Destinasi & Event Tersedia</CardTitle>
                <CardDescription>
                  Submit edit atau delete request untuk destinasi yang sudah ada
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px]">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {destinations.map((destination) => (
                      <Card key={destination.id}>
                        <CardContent className="p-4">
                          <div className="space-y-3">
                            {destination.image && (
                              <img 
                                src={destination.image} 
                                alt={destination.name}
                                className="w-full h-40 object-cover rounded-lg"
                              />
                            )}
                            <div>
                              <h3 className="font-medium">{destination.name}</h3>
                              <p className="text-sm text-muted-foreground flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {destination.location}
                              </p>
                              <Badge variant="secondary" className="mt-2 capitalize">
                                {destination.type}
                              </Badge>
                            </div>
                            <p className="text-sm line-clamp-2">{destination.description}</p>
                            <div className="flex gap-2 pt-2">
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => openEditForm(destination)}
                                className="flex-1 gap-2"
                              >
                                <Edit className="h-3 w-3" />
                                Edit
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => openDeleteForm(destination)}
                                className="flex-1 gap-2 text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-3 w-3" />
                                Hapus
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Submission Form Dialog */}
        <Dialog open={formOpen} onOpenChange={setFormOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {getSubmissionIcon(currentSubmissionType)}
                {currentSubmissionType === 'add' && 'Tambah Destinasi Baru'}
                {currentSubmissionType === 'edit' && 'Edit Destinasi'}
                {currentSubmissionType === 'delete' && 'Hapus Destinasi'}
              </DialogTitle>
              <DialogDescription>
                {currentSubmissionType === 'add' && 'Isi form untuk menambah destinasi atau event baru'}
                {currentSubmissionType === 'edit' && 'Update informasi destinasi yang sudah ada'}
                {currentSubmissionType === 'delete' && 'Kirim request untuk menghapus destinasi ini'}
              </DialogDescription>
            </DialogHeader>

            {currentSubmissionType === 'delete' ? (
              <div className="space-y-4">
                <div className="bg-destructive/10 border border-destructive/20 p-4 rounded-lg">
                  <p className="font-medium text-destructive">Konfirmasi Penghapusan</p>
                  <p className="text-sm mt-2">
                    Anda akan mengirim request untuk menghapus destinasi <strong>{formData.name}</strong>.
                    Request ini akan direview oleh admin.
                  </p>
                </div>
                {formData.image && (
                  <img 
                    src={formData.image} 
                    alt={formData.name}
                    className="w-full h-48 object-cover rounded-lg"
                  />
                )}
              </div>
            ) : (
              <form id="submission-form" onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="name">Nama Destinasi/Event *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Contoh: Candi Borobudur"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="location">Lokasi *</Label>
                    <Input
                      id="location"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      placeholder="Contoh: Magelang, Jawa Tengah"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="type">Tipe *</Label>
                    <Select 
                      value={formData.type} 
                      onValueChange={(value: string) => {
                        if (value === 'destination' || value === 'event') {
                          setFormData({ ...formData, type: value });
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="destination">Destinasi</SelectItem>
                        <SelectItem value="event">Event</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {formData.type === 'event' && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="price">Harga</Label>
                        <Input
                          id="price"
                          value={formData.price}
                          onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                          placeholder="Contoh: Rp 50.000 - Rp 100.000"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="date">Tanggal Event</Label>
                        <Input
                          id="date"
                          type="datetime-local"
                          value={formData.date}
                          onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                        />
                      </div>
                    </>
                  )}

                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="description">Deskripsi *</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Deskripsikan destinasi atau event ini..."
                      rows={4}
                      required
                    />
                  </div>

                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="image">URL Gambar *</Label>
                    <div className="flex gap-2">
                      <Input
                        id="image"
                        value={formData.image}
                        onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                        placeholder="https://images.unsplash.com/..."
                        required
                      />
                      <Button type="button" variant="outline" onClick={handleImageSearch}>
                        <Image className="h-4 w-4" />
                      </Button>
                    </div>
                    {formData.image && (
                      <img 
                        src={formData.image} 
                        alt="Preview"
                        className="w-full h-48 object-cover rounded-lg mt-2"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x300?text=Invalid+Image';
                        }}
                      />
                    )}
                  </div>

                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="tags">Tags</Label>
                    <div className="flex gap-2">
                      <Input
                        id="tags"
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        placeholder="Tambah tag..."
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                      />
                      <Button type="button" onClick={handleAddTag} variant="outline">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {formData.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="gap-1">
                          {tag}
                          <button
                            type="button"
                            onClick={() => handleRemoveTag(tag)}
                            className="ml-1 hover:text-destructive"
                          >
                            ×
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="lat">Latitude *</Label>
                    <Input
                      id="lat"
                      type="number"
                      step="any"
                      value={formData.coordinates.lat}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        coordinates: { ...formData.coordinates, lat: parseFloat(e.target.value) }
                      })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="lng">Longitude *</Label>
                    <Input
                      id="lng"
                      type="number"
                      step="any"
                      value={formData.coordinates.lng}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        coordinates: { ...formData.coordinates, lng: parseFloat(e.target.value) }
                      })}
                      required
                    />
                  </div>
                </div>
              </form>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setFormOpen(false)}>
                Batal
              </Button>
              <Button 
                onClick={currentSubmissionType === 'delete' ? handleSubmit : undefined}
                type={currentSubmissionType !== 'delete' ? 'submit' : 'button'}
                form={currentSubmissionType !== 'delete' ? 'submission-form' : undefined}
                className={currentSubmissionType === 'delete' ? 'bg-destructive hover:bg-destructive/90' : ''}
              >
                {currentSubmissionType === 'delete' ? 'Kirim Request Hapus' : 'Kirim Submission'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}