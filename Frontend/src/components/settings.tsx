import { useState } from "react";
import { User, Mail, MapPin, Bell, Globe, Shield, Info, Trash2, ChevronRight, Camera } from "./icons";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Switch } from "./ui/switch";
import { Separator } from "./ui/separator";
import { Badge } from "./ui/badge";
import { Avatar, AvatarFallback } from "./ui/avatar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "./ui/alert-dialog";

interface SettingsProps {
  user: {
    id: string;
    name: string;
    email: string;
  };
  onBack: () => void;
  onUpdateProfile: (name: string, email: string) => void;
  onDeleteAccount: () => void;
}

export function Settings({ user, onBack, onUpdateProfile, onDeleteAccount }: SettingsProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user.name,
    email: user.email,
  });

  // Notification
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    pushNotifications: true,
    newDestinations: true,
    eventReminders: true,
    weeklyDigest: false,
  });

  // Privacy
  const [privacy, setPrivacy] = useState({
    showProfile: true,
    showLikes: true,
    showReviews: true,
  });

  const [saveLoading, setSaveLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleInputChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value
    }));
  };

  const handleSave = () => {
    setSaveLoading(true);
    setTimeout(() => {
      onUpdateProfile(formData.name, formData.email);
      setIsEditing(false);
      setSaveLoading(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }, 1000);
  };

  const handleCancel = () => {
    setFormData({
      name: user.name,
      email: user.email,
    });
    setIsEditing(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card sticky top-0 z-50">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={onBack}
                className="flex items-center gap-1 sm:gap-2"
              >
                ← Kembali
              </Button>
              <Separator orientation="vertical" className="h-6" />
              <h1 className="text-lg sm:text-xl">Setelan</h1>
            </div>
            {saveSuccess && (
              <Badge variant="default" className="bg-green-500">
                ✓ Tersimpan
              </Badge>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 max-w-4xl">
        <div className="space-y-4 sm:space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Profil Akun
                  </CardTitle>
                  <CardDescription>Kelola informasi profil Anda</CardDescription>
                </div>
                {!isEditing && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditing(true)}
                  >
                    Edit Profil
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16 sm:h-20 sm:w-20">
                  <AvatarFallback className="text-xl sm:text-2xl">
                    {user.name?.charAt(0).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <Button variant="outline" size="sm" disabled>
                    <Camera className="h-4 w-4 mr-2" />
                    Ubah Foto
                  </Button>
                  <p className="text-xs text-muted-foreground mt-1">
                    JPG, PNG atau GIF. Maks 2MB.
                  </p>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="name">Nama Lengkap</Label>
                {isEditing ? (
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={handleInputChange("name")}
                    placeholder="Masukkan nama lengkap"
                  />
                ) : (
                  <p className="text-sm py-2 px-3 bg-muted rounded-md">{user.name}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                {isEditing ? (
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange("email")}
                    placeholder="Masukkan email"
                  />
                ) : (
                  <p className="text-sm py-2 px-3 bg-muted rounded-md">{user.email}</p>
                )}
              </div>

              {isEditing && (
                <div className="flex gap-2 pt-2">
                  <Button
                    onClick={handleSave}
                    disabled={saveLoading || !formData.name || !formData.email}
                    className="flex-1"
                  >
                    {saveLoading ? "Menyimpan..." : "Simpan Perubahan"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleCancel}
                    disabled={saveLoading}
                  >
                    Batal
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notifikasi
              </CardTitle>
              <CardDescription>Kelola preferensi notifikasi Anda</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Notifikasi Email</Label>
                  <p className="text-xs text-muted-foreground">
                    Terima pembaruan melalui email
                  </p>
                </div>
                <Switch
                  checked={notifications.emailNotifications}
                  onCheckedChange={(checked) =>
                    setNotifications(prev => ({ ...prev, emailNotifications: checked }))
                  }
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Notifikasi Push</Label>
                  <p className="text-xs text-muted-foreground">
                    Terima notifikasi push di perangkat
                  </p>
                </div>
                <Switch
                  checked={notifications.pushNotifications}
                  onCheckedChange={(checked) =>
                    setNotifications(prev => ({ ...prev, pushNotifications: checked }))
                  }
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Destinasi Baru</Label>
                  <p className="text-xs text-muted-foreground">
                    Notifikasi saat ada destinasi baru
                  </p>
                </div>
                <Switch
                  checked={notifications.newDestinations}
                  onCheckedChange={(checked) =>
                    setNotifications(prev => ({ ...prev, newDestinations: checked }))
                  }
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Pengingat Event</Label>
                  <p className="text-xs text-muted-foreground">
                    Ingatkan event yang akan datang
                  </p>
                </div>
                <Switch
                  checked={notifications.eventReminders}
                  onCheckedChange={(checked) =>
                    setNotifications(prev => ({ ...prev, eventReminders: checked }))
                  }
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Ringkasan Mingguan</Label>
                  <p className="text-xs text-muted-foreground">
                    Terima ringkasan destinasi setiap minggu
                  </p>
                </div>
                <Switch
                  checked={notifications.weeklyDigest}
                  onCheckedChange={(checked) =>
                    setNotifications(prev => ({ ...prev, weeklyDigest: checked }))
                  }
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Privasi
              </CardTitle>
              <CardDescription>Kontrol visibilitas profil Anda</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Tampilkan Profil Publik</Label>
                  <p className="text-xs text-muted-foreground">
                    Izinkan pengguna lain melihat profil Anda
                  </p>
                </div>
                <Switch
                  checked={privacy.showProfile}
                  onCheckedChange={(checked) =>
                    setPrivacy(prev => ({ ...prev, showProfile: checked }))
                  }
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Tampilkan Lokasi Favorit</Label>
                  <p className="text-xs text-muted-foreground">
                    Izinkan orang lain melihat tempat favorit Anda
                  </p>
                </div>
                <Switch
                  checked={privacy.showLikes}
                  onCheckedChange={(checked) =>
                    setPrivacy(prev => ({ ...prev, showLikes: checked }))
                  }
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Tampilkan Review</Label>
                  <p className="text-xs text-muted-foreground">
                    Tampilkan review Anda secara publik
                  </p>
                </div>
                <Switch
                  checked={privacy.showReviews}
                  onCheckedChange={(checked) =>
                    setPrivacy(prev => ({ ...prev, showReviews: checked }))
                  }
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5" />
                Tentang Aplikasi
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between py-2">
                <span className="text-sm">Versi Aplikasi</span>
                <Badge variant="secondary">v1.0.0 Beta</Badge>
              </div>
              <Separator />
              <div className="flex items-center justify-between py-2">
                <span className="text-sm">Platform</span>
                <span className="text-sm text-muted-foreground">Web Application</span>
              </div>
              <Separator />
              <Button variant="outline" className="w-full justify-between" disabled>
                Syarat & Ketentuan
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button variant="outline" className="w-full justify-between" disabled>
                Kebijakan Privasi
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button variant="outline" className="w-full justify-between" disabled>
                Bantuan & Dukungan
                <ChevronRight className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>

          <Card className="border-destructive/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <Trash2 className="h-5 w-5" />
                Zona Berbahaya
              </CardTitle>
              <CardDescription>
                Tindakan berikut tidak dapat dibatalkan. Harap berhati-hati.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="w-full">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Hapus Akun
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Apakah Anda yakin?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Tindakan ini tidak dapat dibatalkan. Ini akan menghapus akun Anda secara permanen 
                      dan menghapus data Anda dari server kami termasuk semua review, favorit, dan preferensi Anda.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Batal</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={onDeleteAccount}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Ya, Hapus Akun
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t bg-muted/50 mt-8 sm:mt-12">
        <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-8">
          <div className="text-center text-xs sm:text-sm text-muted-foreground space-y-2">
            <p>© 2025 NusaGo. Dibuat dengan ❤️ untuk para wisatawan.</p>
            <p className="px-4">
              Aplikasi demo dengan integrasi peta simulasi.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
