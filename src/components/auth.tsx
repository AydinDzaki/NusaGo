import { useState } from "react";
import { supabase } from "../lib/supabase";
import { Eye, EyeOff, MapPin, User, Mail, Lock, UserPlus, LogIn, CheckCircle } from "./icons"; // Pastikan import CheckCircle jika ada, atau gunakan icon lain
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Separator } from "./ui/separator";
import { Badge } from "./ui/badge";

interface AuthProps {
  onLogin: (email: string, password: string) => void;
  onSignup: (name: string, email: string, password: string) => void;
  onForgotPassword: () => void;
  onBack?: () => void;
  isLoading?: boolean;
  error?: string;
  initialMode?: "login" | "signup";
}

export function Auth({ onLogin, onSignup, onForgotPassword, onBack, initialMode = "login" }: AuthProps) {
  const [isLoginMode, setIsLoginMode] = useState(initialMode === "login");
  const [showPassword, setShowPassword] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState(false); // State baru untuk sukses signup

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    try {
      if (isLoginMode) {
        // === LOGIN ===
        const { error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });
        
        if (error) throw error;
        
      } else {
        // === SIGN UP ===
        if (formData.password !== formData.confirmPassword) {
          throw new Error("Kata sandi tidak cocok");
        }

        // Dapatkan URL saat ini (misal: http://localhost:5173)
        const redirectUrl = window.location.origin;

        const { error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            // PERUBAHAN UTAMA DI SINI:
            emailRedirectTo: redirectUrl, 
            data: {
              name: formData.name, 
            },
          },
        });

        if (error) throw error;
        
        // Ubah tampilan ke mode sukses alih-alih alert
        setSuccessMsg(true);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Terjadi kesalahan pada sistem.");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value
    }));
  };

  const isFormValid = isLoginMode 
    ? formData.email && formData.password
    : formData.name && formData.email && formData.password && formData.confirmPassword && 
      formData.password === formData.confirmPassword;

  // --- TAMPILAN SUKSES KONFIRMASI EMAIL ---
  if (successMsg && !isLoginMode) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-lg border-0 text-center p-6">
           <div className="flex justify-center mb-4">
              <div className="bg-green-100 p-3 rounded-full">
                <Mail className="h-8 w-8 text-green-600" />
              </div>
           </div>
           <CardTitle className="text-xl mb-2">Cek Email Anda</CardTitle>
           <CardDescription className="mb-6">
             Kami telah mengirimkan link konfirmasi ke <strong>{formData.email}</strong>.<br/>
             Silakan klik link tersebut untuk mengaktifkan akun Anda dan kembali ke halaman ini.
           </CardDescription>
           <Button 
             variant="outline" 
             className="w-full"
             onClick={() => {
               setSuccessMsg(false);
               setIsLoginMode(true);
             }}
           >
             Kembali ke Halaman Login
           </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center p-4">
      {/* ... (Sisa kode render form sama seperti sebelumnya) ... */}
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2">
            <MapPin className="h-8 w-8 text-primary" />
            <h1 className="text-2xl">NusaGo</h1>
            <Badge variant="secondary" className="text-xs">Beta</Badge>
          </div>
          {!isLoginMode && (
            <p className="text-muted-foreground">
              Bergabunglah dengan kami dan mulai temukan tempat-tempat menakjubkan!
            </p>
          )}
           {/* Tombol Back */}
           {onBack && (
            <Button
              type="button"
              variant="link"
              className="text-sm text-muted-foreground hover:text-primary"
              onClick={onBack}
            >
              ← Kembali ke Beranda
            </Button>
          )}
        </div>

        {/* Auth Card */}
        <Card className="shadow-lg border-0">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-xl">
              {isLoginMode ? "Sign In" : "Buat Akun"}
            </CardTitle>
            <CardDescription>
              {isLoginMode 
                ? "Masukkan kredensial Anda untuk mengakses akun" 
                : "Isi detail Anda untuk memulai"
              }
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {errorMsg && (
              <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm p-3 rounded-md">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLoginMode && (
                <div className="space-y-2">
                  <Label htmlFor="name">Nama Lengkap</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="name"
                      type="text"
                      placeholder="Masukkan nama lengkap Anda"
                      value={formData.name}
                      onChange={handleInputChange("name")}
                      className="pl-10"
                      required={!isLoginMode}
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Masukkan email Anda"
                    value={formData.email}
                    onChange={handleInputChange("email")}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Kata Sandi</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Masukkan kata sandi Anda"
                    value={formData.password}
                    onChange={handleInputChange("password")}
                    className="pl-10 pr-10"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>

              {!isLoginMode && (
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Konfirmasi Kata Sandi</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="confirmPassword"
                      type={showPassword ? "text" : "password"}
                      placeholder="Konfirmasi kata sandi Anda"
                      value={formData.confirmPassword}
                      onChange={handleInputChange("confirmPassword")}
                      className="pl-10"
                      required={!isLoginMode}
                    />
                  </div>
                  {!isLoginMode && formData.password && formData.confirmPassword && 
                   formData.password !== formData.confirmPassword && (
                    <p className="text-sm text-destructive">Kata sandi tidak cocok</p>
                  )}
                </div>
              )}

              <Button 
                type="submit" 
                className="w-full" 
                disabled={!isFormValid || loading}
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    {isLoginMode ? "Signing in..." : "Membuat akun..."}
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    {isLoginMode ? (
                      <LogIn className="h-4 w-4" />
                    ) : (
                      <UserPlus className="h-4 w-4" />
                    )}
                    {isLoginMode ? "Sign In" : "Buat Akun"}
                  </div>
                )}
              </Button>
            </form>

            {isLoginMode && (
              <div className="text-center">
                <Button
                  type="button"
                  variant="link"
                  className="text-sm text-primary hover:underline p-0 h-auto"
                  onClick={onForgotPassword}
                >
                  Lupa Password?
                </Button>
              </div>
            )}

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">Atau</span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => {
                setIsLoginMode(!isLoginMode);
                setFormData({ name: "", email: "", password: "", confirmPassword: "" });
                setErrorMsg("");
              }}
            >
              {isLoginMode ? (
                <div className="flex items-center gap-2">
                  <UserPlus className="h-4 w-4" />
                  Buat akun baru
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <LogIn className="h-4 w-4" />
                  Sign In ke akun yang ada
                </div>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-xs text-muted-foreground">
          <p>© 2025 NusaGo. Dibuat dengan ❤️ untuk para wisatawan.</p>
        </div>
      </div>
    </div>
  );
}