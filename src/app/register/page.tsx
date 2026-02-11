'use client';

import { AnimatedWrapper } from '@/components/animated-wrapper';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { auth, db } from '@/lib/firebase';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useRouter } from 'next/navigation';
import { useAuth } from "@/hooks/use-auth";
import {
  X,
  GraduationCap,
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
  Camera,
  CheckCircle2
} from 'lucide-react';

const CAREERS = [
  'Ingeniería en TICs',
  'Psicología',
  'Psicología Clínica',
  'Negocios Internacionales',
  'Marketing',
  'Derecho',
  'Arquitectura',
];

export default function RegisterPage() {
  const { user, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isUideStudent, setIsUideStudent] = useState(false);
  const [career, setCareer] = useState('');
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push('/projects');
    }
  }, [user, loading, router]);

  if (loading || user) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#F8FAFC] dark:bg-[#0A1A3C]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      // Validación de tamaño (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        setError('La imagen no puede superar los 5MB');
        return;
      }

      // Validación de tipo
      if (!file.type.startsWith('image/')) {
        setError('Solo se permiten archivos de imagen');
        return;
      }

      setPhoto(file);
      setPreview(URL.createObjectURL(file));
      setError(''); // Limpiar error si había
    }
  };

  const handleAddSkill = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if ((e.key === 'Enter' || e.key === 'Tab') && skillInput.trim()) {
      e.preventDefault();
      const trimmedSkill = skillInput.trim();

      // Validar longitud
      if (trimmedSkill.length < 2) {
        return;
      }

      if (!skills.includes(trimmedSkill)) {
        setSkills([...skills, trimmedSkill]);
      }
      setSkillInput('');
    }
  };

  const removeSkill = (skill: string) => {
    setSkills(skills.filter(s => s !== skill));
  };

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Validate student fields
    if (isUideStudent && !career) {
      setError('Por favor, selecciona tu carrera.');
      setIsLoading(false);
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      let photoURL = 'https://placehold.co/128x128.png';

      const saveUserData = async (finalPhotoURL: string) => {
        await updateProfile(user, {
          displayName: `${firstName} ${lastName}`,
          photoURL: finalPhotoURL
        });

        const userData: Record<string, unknown> = {
          firstName,
          lastName,
          email,
          photoURL: finalPhotoURL,
          isUideStudent,
          role: isUideStudent ? 'student' : 'viewer',
          createdAt: new Date().toISOString(),
        };

        if (isUideStudent) {
          userData.career = career;
          userData.skills = skills;
        }

        await setDoc(doc(db, "users", user.uid), userData);

        setShowSuccessAlert(true);
        setTimeout(() => {
          window.location.href = '/';
        }, 1500);
      };

      if (photo) {
        const reader = new FileReader();
        reader.readAsDataURL(photo);
        reader.onloadend = async () => {
          try {
            const base64file = reader.result;
            const res = await fetch('/api/upload', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ file: base64file }),
            });
            const { url } = await res.json();
            photoURL = url;
            await saveUserData(photoURL);
          } catch (err) {
            console.error('Error uploading photo:', err);
            await saveUserData(photoURL);
          }
        };
      } else {
        await saveUserData(photoURL);
      }
    } catch (err: unknown) {
      console.error(err);
      if (err instanceof Error) {
        if (err.message.includes('email-already-in-use')) {
          setError('Este correo ya está registrado.');
        } else if (err.message.includes('weak-password')) {
          setError('La contraseña debe tener al menos 6 caracteres.');
        } else if (err.message.includes('invalid-email')) {
          setError('El formato del correo no es válido.');
        } else {
          setError('Error al crear la cuenta. Inténtalo de nuevo.');
        }
      }
      setIsLoading(false);
    }
  };

  // Validación de contraseña en tiempo real
  const passwordStrength = password.length >= 8 ? 'strong' : password.length >= 6 ? 'medium' : 'weak';
  const getPasswordColor = () => {
    if (password.length === 0) return '';
    if (passwordStrength === 'strong') return 'text-green-600 dark:text-green-500';
    if (passwordStrength === 'medium') return 'text-yellow-600 dark:text-yellow-500';
    return 'text-red-600 dark:text-red-500';
  };

  return (
    <div className="container flex min-h-screen items-center justify-center pt-28 pb-12 px-4">
      {/* Alerta de Éxito */}
      {showSuccessAlert && (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-5 fade-in duration-300">
          <div
            className="flex items-center gap-3 rounded-lg p-4 pr-12 shadow-2xl border-2 min-w-[320px]"
            style={{
              backgroundColor: '#f0a800',
              borderColor: '#d89500',
            }}
          >
            <CheckCircle2 className="h-6 w-6 shrink-0" style={{ color: '#1a1a1a' }} />
            <div>
              <p className="font-bold text-base" style={{ color: '#1a1a1a' }}>
                ¡Bienvenido a Uideverse!
              </p>
              <p className="text-sm font-medium" style={{ color: '#1a1a1a' }}>
                Tu cuenta ha sido creada exitosamente
              </p>
            </div>
          </div>
        </div>
      )}

      <AnimatedWrapper>
        <Card className="mx-auto max-w-lg w-full shadow-lg">
          <CardHeader className="space-y-1 text-center pb-6">
            <CardTitle className="text-3xl font-bold tracking-tight">
              Únete a Uideverse Hub
            </CardTitle>
            <CardDescription className="text-base">
              Crea tu cuenta y empieza a explorar proyectos increíbles
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleRegister} className="space-y-5">
              {/* Mensaje de error */}
              {error && (
                <div className="flex items-start gap-2 rounded-lg bg-red-50 dark:bg-red-950/20 p-3 text-sm text-red-800 dark:text-red-400 border border-red-200 dark:border-red-900">
                  <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                  <p>{error}</p>
                </div>
              )}

              {/* Avatar con mejores affordances */}
              <div className="flex flex-col items-center gap-3">
                <label
                  htmlFor="photo-upload"
                  className="relative cursor-pointer group"
                  aria-label="Subir foto de perfil"
                >
                  <Avatar className="w-28 h-28 border-4 border-muted transition-all group-hover:border-primary group-hover:scale-105">
                    <AvatarImage
                      src={preview || 'https://placehold.co/128x128.png'}
                      alt="Vista previa de foto de perfil"
                    />
                    <AvatarFallback className="text-2xl">
                      {firstName?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Camera className="h-8 w-8 text-white" />
                  </div>
                </label>
                <Input
                  id="photo-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                  disabled={isLoading}
                />
                <div className="text-center">
                  <p className="text-sm font-medium text-foreground">
                    {preview ? 'Cambiar foto' : 'Agregar foto de perfil'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    JPG, PNG o GIF (máx. 5MB)
                  </p>
                </div>
              </div>

              {/* Nombre y Apellido con iconos */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="first-name" className="text-sm font-medium">
                    Nombre
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="first-name"
                      placeholder="Ej: Max"
                      required
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      disabled={isLoading}
                      className="pl-10 h-11"
                      autoComplete="given-name"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last-name" className="text-sm font-medium">
                    Apellido
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="last-name"
                      placeholder="Ej: Robinson"
                      required
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      disabled={isLoading}
                      className="pl-10 h-11"
                      autoComplete="family-name"
                    />
                  </div>
                </div>
              </div>

              {/* Correo con icono */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Correo electrónico
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="tu@ejemplo.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                    className="pl-10 h-11"
                    autoComplete="email"
                  />
                </div>
              </div>

              {/* Contraseña con toggle y validación visual */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  Contraseña
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Mínimo 6 caracteres"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                    className="pl-10 pr-10 h-11"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded p-0.5"
                    aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {password.length > 0 && (
                  <p className={`text-xs font-medium ${getPasswordColor()}`}>
                    {passwordStrength === 'strong' && '✓ Contraseña segura'}
                    {passwordStrength === 'medium' && '⚠ Contraseña aceptable (8+ caracteres recomendado)'}
                    {passwordStrength === 'weak' && '⚠ Contraseña débil'}
                  </p>
                )}
              </div>

              {/* Checkbox Estudiante UIDE - CORREGIDO */}
              <div
                className={`
                  flex items-start space-x-3 rounded-lg border-2 p-4 transition-all
                  ${isUideStudent
                    ? 'bg-primary/10 border-primary shadow-sm'
                    : 'bg-muted/30 border-transparent hover:border-muted-foreground/20'
                  }
                `}
              >
                <Checkbox
                  id="is-student"
                  checked={isUideStudent}
                  onCheckedChange={(checked) => setIsUideStudent(checked as boolean)}
                  disabled={isLoading}
                  className="mt-0.5"
                />
                <div className="flex-1 space-y-1 leading-none">
                  <Label
                    htmlFor="is-student"
                    className="flex items-center gap-2 cursor-pointer font-medium"
                  >
                    <GraduationCap className={`h-5 w-5 ${isUideStudent ? 'text-primary' : 'text-muted-foreground'}`} />
                    Soy estudiante de la UIDE
                  </Label>
                  <p className="text-xs text-muted-foreground pt-1">
                    Accede a funciones exclusivas: sube proyectos, conecta con otros estudiantes y más
                  </p>
                </div>
              </div>

              {/* Campos para estudiantes con animación */}
              {isUideStudent && (
                <div className="space-y-4 p-4 border-2 border-primary/20 rounded-lg bg-primary/5 animate-in fade-in-50 slide-in-from-top-2 duration-300">
                  <div className="flex items-center gap-2 pb-2">
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                    <p className="text-sm font-semibold text-foreground">
                      Información de estudiante
                    </p>
                  </div>

                  {/* Carrera */}
                  <div className="space-y-2">
                    <Label htmlFor="career" className="text-sm font-medium">
                      Carrera <span className="text-red-500">*</span>
                    </Label>
                    <Select value={career} onValueChange={setCareer} disabled={isLoading}>
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="Selecciona tu carrera" />
                      </SelectTrigger>
                      <SelectContent>
                        {CAREERS.map((c) => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Habilidades mejoradas */}
                  <div className="space-y-2">
                    <Label htmlFor="skill-input" className="text-sm font-medium">
                      Habilidades
                      {skills.length > 0 && (
                        <span className="ml-2 text-xs text-muted-foreground">
                          ({skills.length} agregada{skills.length !== 1 ? 's' : ''})
                        </span>
                      )}
                    </Label>
                    <div
                      className="flex flex-wrap gap-2 px-3 py-2.5 border-2 rounded-lg bg-background shadow-sm transition-all focus-within:outline-none focus-within:ring-2 focus-within:ring-primary focus-within:border-primary min-h-[3rem] cursor-text"
                      onClick={() => !isLoading && document.getElementById('skill-input')?.focus()}
                    >
                      {skills.map((skill, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-1.5 bg-primary/10 text-primary border border-primary/20 px-3 py-1.5 rounded-md text-sm font-medium transition-all hover:bg-primary/20 animate-in fade-in-50 zoom-in-95"
                        >
                          {skill}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeSkill(skill);
                            }}
                            disabled={isLoading}
                            className="text-primary/70 hover:text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary rounded-sm p-0.5"
                            aria-label={`Eliminar ${skill}`}
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                      <input
                        id="skill-input"
                        className="flex-1 min-w-[140px] bg-transparent border-none outline-none text-sm placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                        placeholder={skills.length ? 'Agregar otra...' : "React, Figma, Python, Diseño UX..."}
                        value={skillInput}
                        onChange={(e) => setSkillInput(e.target.value)}
                        onKeyDown={handleAddSkill}
                        disabled={isLoading}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary"></span>
                      Presiona Enter o Tab para agregar cada habilidad
                    </p>
                  </div>
                </div>
              )}

              {/* Botón de submit */}
              <Button
                type="submit"
                className="w-full h-11 text-base font-medium"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Creando tu cuenta...
                  </>
                ) : (
                  'Crear cuenta'
                )}
              </Button>

              {/* Separador */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">
                    ¿Ya tienes cuenta?
                  </span>
                </div>
              </div>

              {/* Link de login */}
              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  <Link
                    href="/login"
                    className="font-semibold text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
                  >
                    Inicia sesión aquí
                  </Link>
                </p>
              </div>
            </form>
          </CardContent>
        </Card>
      </AnimatedWrapper>
    </div>
  );
}