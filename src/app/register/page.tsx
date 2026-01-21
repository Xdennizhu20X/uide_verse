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
import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useRouter } from 'next/navigation';
import { X, GraduationCap } from 'lucide-react';

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
  const router = useRouter();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPhoto(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleAddSkill = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if ((e.key === 'Enter' || e.key === 'Tab') && skillInput.trim()) {
      e.preventDefault();
      if (!skills.includes(skillInput.trim())) {
        setSkills([...skills, skillInput.trim()]);
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
        router.push('/');
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
        } else {
          setError('Error al crear la cuenta. Inténtalo de nuevo.');
        }
      }
      setIsLoading(false);
    }
  };

  return (
    <div className="container flex items-center justify-center py-8">
      <AnimatedWrapper>
        <Card className="mx-auto max-w-md w-full">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl">Registrarse</CardTitle>
            <CardDescription>
              Crea una cuenta para explorar Uideverse Hub.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleRegister} className="space-y-4">
              {error && (
                <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md">
                  {error}
                </div>
              )}

              {/* Avatar clickeable */}
              <div className="flex flex-col items-center gap-2">
                <label htmlFor="photo-upload" className="cursor-pointer">
                  <Avatar className="w-24 h-24">
                    <AvatarImage src={preview || 'https://placehold.co/128x128.png'} alt="user photo" />
                    <AvatarFallback>{firstName?.charAt(0) || 'U'}</AvatarFallback>
                  </Avatar>
                </label>
                <Input id="photo-upload" type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                <p className="text-xs text-muted-foreground">Clic para subir foto</p>
              </div>

              {/* Nombre y Apellido */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="first-name">Nombre</Label>
                  <Input id="first-name" placeholder="Max" required value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="last-name">Apellido</Label>
                  <Input id="last-name" placeholder="Robinson" required value={lastName} onChange={(e) => setLastName(e.target.value)} />
                </div>
              </div>

              {/* Correo */}
              <div>
                <Label htmlFor="email">Correo</Label>
                <Input id="email" type="email" placeholder="nombre@ejemplo.com" required value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>

              {/* Checkbox Estudiante UIDE */}
              <div className="flex items-start space-x-3 rounded-md border p-4 bg-muted/30">
                <Checkbox
                  id="is-student"
                  checked={isUideStudent}
                  onCheckedChange={(checked) => setIsUideStudent(checked as boolean)}
                />
                <div className="space-y-1 leading-none">
                  <Label htmlFor="is-student" className="flex items-center gap-2 cursor-pointer">
                    <GraduationCap className="h-4 w-4 text-primary" />
                    Soy estudiante de la UIDE
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Los estudiantes pueden subir proyectos a la plataforma.
                  </p>
                </div>
              </div>

              {/* Campos solo para estudiantes */}
              {isUideStudent && (
                <div className="space-y-4 p-4 border rounded-md bg-primary/5">
                  {/* Carrera */}
                  <div>
                    <Label htmlFor="career">Carrera *</Label>
                    <Select value={career} onValueChange={setCareer}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona tu carrera" />
                      </SelectTrigger>
                      <SelectContent>
                        {CAREERS.map((c) => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Habilidades como tags */}
                  <div className="space-y-2">
                    <Label htmlFor="skills">Habilidades</Label>
                    <div
                      className="flex flex-wrap gap-2 px-3 py-2 border rounded-md bg-background shadow-sm transition-colors focus-within:outline-none focus-within:ring-1 focus-within:ring-ring"
                      onClick={() => document.getElementById('skill-input')?.focus()}
                    >
                      {skills.map((skill, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-1 bg-secondary text-secondary-foreground px-2 py-1 rounded-md text-sm"
                        >
                          {skill}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeSkill(skill);
                            }}
                            className="text-muted-foreground hover:text-foreground transition-colors"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                      <input
                        id="skill-input"
                        className="flex-1 min-w-[120px] bg-transparent border-none outline-none text-sm"
                        placeholder={skills.length ? '' : "React, Figma, Python..."}
                        value={skillInput}
                        onChange={(e) => setSkillInput(e.target.value)}
                        onKeyDown={handleAddSkill}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Presiona Enter para agregar una habilidad
                    </p>
                  </div>
                </div>
              )}

              {/* Contraseña */}
              <div>
                <Label htmlFor="password">Contraseña</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Mínimo 6 caracteres"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Creando cuenta...' : 'Crear cuenta'}
              </Button>
            </form>

            <div className="mt-4 text-center text-sm">
              ¿Ya tienes una cuenta?{' '}
              <Link href="/login" className="underline text-primary">Inicia sesión</Link>
            </div>
          </CardContent>
        </Card>
      </AnimatedWrapper>
    </div>
  );
}
