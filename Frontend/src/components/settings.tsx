import { useState, useCallback, useRef, useEffect } from "react";
// Import Supabase Client
import { supabase } from "../lib/supabase"; 

import { User, Mail, MapPin, Bell, Globe, Shield, Info, Trash2, ChevronRight, Camera } from "./icons";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Switch } from "./ui/switch";
import { Separator } from "./ui/separator";
import { Badge } from "./ui/badge";
// Import AvatarImage untuk menampilkan foto
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar"; 
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

// MODIFIKASI: Interface UserData dan Props diperluas untuk data preferensi dan avatar
interface UserData {
    id: string;
    name: string;
    email: string;
    avatar_url: string | null; // DITAMBAHKAN
    preferences?: {
        notifications: {
            email_notifications: boolean;
            push_notifications: boolean;
            new_destinations: boolean;
            event_reminders: boolean;
            weekly_digest: boolean;
        };
        privacy: {
            show_profile: boolean;
            show_likes: boolean;
            show_reviews: boolean;
        };
    };
}

type NotificationKeys = keyof UserData['preferences']['notifications'];
type PrivacyKeys = keyof UserData['preferences']['privacy'];

interface SettingsProps {
    user: UserData;
    onBack: () => void;
    onUpdateProfile: (name: string, email: string) => Promise<boolean>; 
    onDeleteAccount: () => void;
    onUpdatePreferences: (updates: any) => Promise<boolean>; 
}

// FUNGSI UTILITY: Mengubah snake_case ke camelCase untuk state lokal
const toCamelCase = (s: string) => s.replace(/([-_][a-z])/ig, ($1) => $1.toUpperCase().replace('-', '').replace('_', ''));

export function Settings({ user, onBack, onUpdateProfile, onDeleteAccount, onUpdatePreferences }: SettingsProps) {
    // Refs
    const fileInputRef = useRef<HTMLInputElement>(null); // Ref untuk input file tersembunyi

    // State Profil Inti
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        name: user.name,
        email: user.email,
    });
    // DITAMBAHKAN: State Foto Profil (menggunakan URL dari props)
    const [avatarUrl, setAvatarUrl] = useState(user.avatar_url || null); 

    // State Preferensi (Ambil dari props atau gunakan default)
    const initialNotifications = user.preferences?.notifications || {
        email_notifications: true,
        push_notifications: true,
        new_destinations: true,
        event_reminders: true,
        weekly_digest: false,
    };

    const initialPrivacy = user.preferences?.privacy || {
        show_profile: true,
        show_likes: true,
        show_reviews: true,
    };

    // State ini sekarang menggunakan snake_case agar mudah di-map ke Supabase
    const [notifications, setNotifications] = useState(initialNotifications);
    const [privacy, setPrivacy] = useState(initialPrivacy);
    
    // State UI & Loading
    const [saveLoading, setSaveLoading] = useState(false); // Untuk tombol Simpan
    const [prefSaving, setPrefSaving] = useState(false); // Untuk switch
    const [saveSuccess, setSaveSuccess] = useState(false);


    // ==========================================
    // HANDLER UTAMA PROFIL (Nama & Email)
    // ==========================================
    const handleInputChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({
            ...prev,
            [field]: e.target.value
        }));
    };

    const handleSave = async () => {
        setSaveLoading(true);
        const success = await onUpdateProfile(formData.name, formData.email); 

        if (success) {
            setIsEditing(false);
            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 3000);
        }
        setSaveLoading(false);
    };

    const handleCancel = () => {
        setFormData({
            name: user.name,
            email: user.email,
        });
        setIsEditing(false);
    };

    // ==========================================
    // HANDLER UNGGAH FOTO PROFIL (Supabase Storage)
    // ==========================================
    const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        if (!event.target.files || event.target.files.length === 0) {
            return;
        }
        const file = event.target.files[0];
        
        // Batasan ukuran file (Maks 2MB)
        if (file.size > 2 * 1024 * 1024) { 
            alert('Ukuran file melebihi batas (Maks 2MB).');
            return;
        }

        const fileExt = file.name.split('.').pop();
        // Nama file unik: userID + timestamp
        const fileName = `${user.id}-${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`;

        setSaveLoading(true); 

        // 1. Upload file ke Supabase Storage (Bucket: images)
        const { error: uploadError } = await supabase.storage
            .from('images') // NAMA BUCKET ANDA (images)
            .upload(filePath, file, {
                cacheControl: '3600',
                upsert: true 
            });

        if (uploadError) {
            alert('Gagal mengunggah gambar: ' + uploadError.message);
            setSaveLoading(false);
            return;
        }

        // 2. Dapatkan URL publik
        const { data: publicUrlData } = supabase.storage
            .from('images')
            .getPublicUrl(filePath);

        const newAvatarUrl = publicUrlData.publicUrl;

        // 3. Update kolom avatar_url di tabel profiles
        const { error: updateError } = await supabase
            .from('profiles')
            .update({ avatar_url: newAvatarUrl })
            .eq('id', user.id);

        if (updateError) {
            alert('Gagal menyimpan URL gambar ke database.');
            setSaveLoading(false);
            return;
        }

        // 4. Perbarui state lokal
        setAvatarUrl(newAvatarUrl); 
        setSaveLoading(false);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
    };

    // ==========================================
    // HANDLER PREFERENSI (Notifikasi & Privasi)
    // ==========================================
    const handleToggleSave = useCallback(async (
        type: 'notifications' | 'privacy',
        key: NotificationKeys | PrivacyKeys, 
        checked: boolean
    ) => {
        setPrefSaving(true);
        
        // Update state lokal secara spekulatif (akan dibalik jika gagal)
        const currentUpdates = type === 'notifications' ? { ...notifications, [key]: checked } : { ...privacy, [key]: checked };
        
        // Persiapan data untuk upsert (mengirim semua kolom boolean)
        const allUpdates = { 
            ...notifications, 
            ...privacy, 
            [key]: checked 
        };

        const success = await onUpdatePreferences(allUpdates);

        setPrefSaving(false);

        if (success) {
            // Update state lokal resmi
            if (type === 'notifications') {
                setNotifications(currentUpdates as typeof initialNotifications);
            } else {
                setPrivacy(currentUpdates as typeof initialPrivacy);
            }
            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 3000);
        } else {
            alert("Gagal menyimpan preferensi. Silakan coba lagi.");
        }
    }, [notifications, privacy, onUpdatePreferences]);


    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
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
                        {(saveSuccess || prefSaving || saveLoading) && (
                            <Badge variant="default" className={(prefSaving || saveLoading) ? "bg-primary" : "bg-green-500"}>
                                {(prefSaving || saveLoading) ? "Menyimpan..." : "✓ Tersimpan"}
                            </Badge>
                        )}
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 max-w-4xl">
                <div className="space-y-4 sm:space-y-6">
                    {/* Profile Section */}
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
                            {/* Avatar Section */}
                            <div className="flex items-center gap-4">
                                <Avatar className="h-16 w-16 sm:h-20 sm:w-20">
                                    {/* Menampilkan foto jika avatarUrl ada */}
                                    {avatarUrl ? (
                                        <AvatarImage src={avatarUrl} alt="Avatar Pengguna" />
                                    ) : (
                                        <AvatarFallback className="text-xl sm:text-2xl">
                                            {user.name?.charAt(0).toUpperCase() || "U"}
                                        </AvatarFallback>
                                    )}
                                </Avatar>
                                <div className="flex-1">
                                    {/* Input file tersembunyi */}
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={handleAvatarUpload}
                                        accept="image/png, image/jpeg, image/gif"
                                        style={{ display: 'none' }} 
                                    />
                                    <Button 
                                        variant="outline" 
                                        size="sm" 
                                        onClick={() => fileInputRef.current?.click()} // Memicu klik
                                        disabled={saveLoading || prefSaving}
                                    >
                                        <Camera className="h-4 w-4 mr-2" />
                                        Ubah Foto
                                    </Button>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        JPG, PNG atau GIF. Maks 2MB.
                                    </p>
                                </div>
                            </div>

                            <Separator />

                            {/* Nama & Email Inputs */}
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

                            {/* Action Buttons */}
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

                    {/* Notification Settings */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Bell className="h-5 w-5" />
                                Notifikasi
                            </CardTitle>
                            <CardDescription>Kelola preferensi notifikasi Anda</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Notifikasi Email */}
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label>Notifikasi Email</Label>
                                    <p className="text-xs text-muted-foreground">Terima pembaruan melalui email</p>
                                </div>
                                <Switch
                                    checked={notifications.email_notifications}
                                    onCheckedChange={(checked) =>
                                        handleToggleSave('notifications', 'email_notifications', checked)
                                    }
                                    disabled={prefSaving}
                                />
                            </div>

                            <Separator />

                            {/* Notifikasi Push */}
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label>Notifikasi Push</Label>
                                    <p className="text-xs text-muted-foreground">Terima notifikasi push di perangkat</p>
                                </div>
                                <Switch
                                    checked={notifications.push_notifications}
                                    onCheckedChange={(checked) =>
                                        handleToggleSave('notifications', 'push_notifications', checked)
                                    }
                                    disabled={prefSaving}
                                />
                            </div>

                            <Separator />

                            {/* Destinasi Baru */}
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label>Destinasi Baru</Label>
                                    <p className="text-xs text-muted-foreground">Notifikasi saat ada destinasi baru</p>
                                </div>
                                <Switch
                                    checked={notifications.new_destinations}
                                    onCheckedChange={(checked) =>
                                        handleToggleSave('notifications', 'new_destinations', checked)
                                    }
                                    disabled={prefSaving}
                                />
                            </div>

                            <Separator />

                            {/* Pengingat Event */}
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label>Pengingat Event</Label>
                                    <p className="text-xs text-muted-foreground">Ingatkan event yang akan datang</p>
                                </div>
                                <Switch
                                    checked={notifications.event_reminders}
                                    onCheckedChange={(checked) =>
                                        handleToggleSave('notifications', 'event_reminders', checked)
                                    }
                                    disabled={prefSaving}
                                />
                            </div>

                            <Separator />

                            {/* Ringkasan Mingguan */}
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label>Ringkasan Mingguan</Label>
                                    <p className="text-xs text-muted-foreground">Terima ringkasan destinasi setiap minggu</p>
                                </div>
                                <Switch
                                    checked={notifications.weekly_digest}
                                    onCheckedChange={(checked) =>
                                        handleToggleSave('notifications', 'weekly_digest', checked)
                                    }
                                    disabled={prefSaving}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Privacy Settings */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Shield className="h-5 w-5" />
                                Privasi
                            </CardTitle>
                            <CardDescription>Kontrol visibilitas profil Anda</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Tampilkan Profil Publik */}
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label>Tampilkan Profil Publik</Label>
                                    <p className="text-xs text-muted-foreground">Izinkan pengguna lain melihat profil Anda</p>
                                </div>
                                <Switch
                                    checked={privacy.show_profile}
                                    onCheckedChange={(checked) =>
                                        handleToggleSave('privacy', 'show_profile', checked)
                                    }
                                    disabled={prefSaving}
                                />
                            </div>

                            <Separator />

                            {/* Tampilkan Lokasi Favorit */}
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label>Tampilkan Lokasi Favorit</Label>
                                    <p className="text-xs text-muted-foreground">Izinkan orang lain melihat tempat favorit Anda</p>
                                </div>
                                <Switch
                                    checked={privacy.show_likes}
                                    onCheckedChange={(checked) =>
                                        handleToggleSave('privacy', 'show_likes', checked)
                                    }
                                    disabled={prefSaving}
                                />
                            </div>

                            <Separator />

                            {/* Tampilkan Review */}
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label>Tampilkan Review</Label>
                                    <p className="text-xs text-muted-foreground">Tampilkan review Anda secara publik</p>
                                </div>
                                <Switch
                                    checked={privacy.show_reviews}
                                    onCheckedChange={(checked) =>
                                        handleToggleSave('privacy', 'show_reviews', checked)
                                    }
                                    disabled={prefSaving}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* App Information */}
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

                    {/* Danger Zone */}
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