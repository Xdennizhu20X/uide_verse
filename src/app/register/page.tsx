'use client';

import { AnimatedWrapper } from '@/components/animated-wrapper';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { auth, db } from '@/lib/firebase';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import Link from 'next/link';
import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [technologies, setTechnologies] = useState('');
  const router = useRouter();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPhoto(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      let photoURL = 'https://placehold.co/128x128.png'; // Default photo

      const techArray = technologies.split(',').map(t => t.trim());

      if (photo) {
        const reader = new FileReader();
        reader.readAsDataURL(photo);
        reader.onloadend = async () => {
          const base64file = reader.result;
          const res = await fetch('/api/upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ file: base64file }),
          });
          const { url } = await res.json();
          photoURL = url;

          await updateProfile(user, {
            displayName: `${firstName} ${lastName}`,
            photoURL: photoURL,
          });

          await setDoc(doc(db, "users", user.uid), {
            firstName: firstName,
            lastName: lastName,
            email: email,
            photoURL: photoURL,
            technologies: techArray,
          });

          router.push('/projects');
        }
      } else {
        await updateProfile(user, {
            displayName: `${firstName} ${lastName}`,
            photoURL: photoURL,
        });

        await setDoc(doc(db, "users", user.uid), {
            firstName: firstName,
            lastName: lastName,
            email: email,
            photoURL: photoURL,
            technologies: techArray,
        });

        router.push('/projects');
      }

      console.log("User created successfully and data saved to Firestore");
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="container flex h-[calc(100vh-4rem)] items-center justify-center py-12">
      <AnimatedWrapper>
        <Card className="mx-auto max-w-sm">
          <CardHeader>
            <CardTitle className="text-2xl">Registrarse</CardTitle>
            <CardDescription>
              Crea una cuenta para empezar a explorar Uideverse Hub.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleRegister}>
              <div className="grid gap-4">
                <div className="flex flex-col items-center gap-2 mb-4">
                    <Avatar className='w-32 h-32'>
                        <AvatarImage src={preview || 'https://placehold.co/128x128.png'} alt="user photo" />
                        <AvatarFallback>{firstName?.charAt(0) || 'U'}</AvatarFallback>
                    </Avatar>
                    <Label htmlFor="photo-upload" className='cursor-pointer text-sm text-muted-foreground hover:text-primary'>
                        Subir foto de perfil
                    </Label>
                    <Input id="photo-upload" type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="first-name">Nombre</Label>
                    <Input
                      id="first-name"
                      placeholder="Max"
                      required
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="last-name">Apellido</Label>
                    <Input
                      id="last-name"
                      placeholder="Robinson"
                      required
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Correo electrónico</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="nombre@ejemplo.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="technologies">Tecnologías (separadas por comas)</Label>
                  <Input
                    id="technologies"
                    placeholder="React, Next.js, IA"
                    value={technologies}
                    onChange={(e) => setTechnologies(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="password">Contraseña</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <Button type="submit" className="w-full">
                  Crear una cuenta
                </Button>
              </div>
            </form>
            <div className="mt-4 text-center text-sm">
              ¿Ya tienes una cuenta?{' '}
              <Link href="/login" className="underline">
                Iniciar sesión
              </Link>
            </div>
          </CardContent>
        </Card>
      </AnimatedWrapper>
    </div>
  );
}