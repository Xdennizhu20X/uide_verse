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
import { X } from 'lucide-react';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [technologies, setTechnologies] = useState<string[]>([]);
  const [techInput, setTechInput] = useState('');
  const router = useRouter();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPhoto(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleAddTechnology = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if ((e.key === 'Enter' || e.key === 'Tab') && techInput.trim()) {
      e.preventDefault();
      if (!technologies.includes(techInput.trim())) {
        setTechnologies([...technologies, techInput.trim()]);
      }
      setTechInput('');
    }
  };

  const removeTechnology = (tech: string) => {
    setTechnologies(technologies.filter(t => t !== tech));
  };

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      let photoURL = 'https://placehold.co/128x128.png';

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

          await updateProfile(user, { displayName: `${firstName} ${lastName}`, photoURL });
          await setDoc(doc(db, "users", user.uid), {
            firstName, lastName, email, photoURL, technologies,
          });
          router.push('/');
        };
      } else {
        await updateProfile(user, { displayName: `${firstName} ${lastName}`, photoURL });
        await setDoc(doc(db, "users", user.uid), {
          firstName, lastName, email, photoURL, technologies,
        });
        router.push('/');
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="container flex items-center justify-center py-8">
      <AnimatedWrapper>
        <Card className="mx-auto max-w-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl">Registrarse</CardTitle>
            <CardDescription>
              Crea una cuenta para explorar Uideverse Hub.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleRegister} className="space-y-3">
              {/* Avatar clickeable */}
              <div className="flex flex-col items-center gap-2">
                <label htmlFor="photo-upload" className="cursor-pointer">
                  <Avatar className="w-24 h-24">
                    <AvatarImage src={preview || 'https://placehold.co/128x128.png'} alt="user photo" />
                    <AvatarFallback>{firstName?.charAt(0) || 'U'}</AvatarFallback>
                  </Avatar>
                </label>
                <Input id="photo-upload" type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
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

              {/* Tecnologías como tags */}
              <div className="space-y-2">
                <Label htmlFor="technologies">Tecnologías</Label>
                <div 
                  className="flex flex-wrap gap-2 px-3 py-2 border rounded-md shadow-sm transition-colors focus-within:outline-none focus-within:ring-1 focus-within:ring-ring"
                  onClick={() => document.getElementById('tech-input')?.focus()}
                >
                  {technologies.map((tech, i) => (
                    <div 
                      key={i} 
                      className="flex items-center gap-1 bg-accent text-accent-foreground px-2 py-1 rounded-md text-sm"
                    >
                      {tech}
                      <button 
                        type="button" 
                        onClick={(e) => {
                          e.stopPropagation();
                          removeTechnology(tech);
                        }} 
                        className="text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                  <input
                    id="tech-input"
                    className="flex-1 min-w-[120px] bg-transparent border-none outline-none text-sm"
                    placeholder={technologies.length ? '' : "Escribe y presiona Enter"}
                    value={techInput}
                    onChange={(e) => setTechInput(e.target.value)}
                    onKeyDown={handleAddTechnology}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Presiona Enter o Tab para agregar una tecnología
                </p>
              </div>

              {/* Contraseña */}
              <div>
                <Label htmlFor="password">Contraseña</Label>
                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>

              <Button type="submit" className="w-full">Crear cuenta</Button>
            </form>

            <div className="mt-3 text-center text-sm">
              ¿Ya tienes una cuenta?{' '}
              <Link href="/login" className="underline">Inicia sesión</Link>
            </div>
          </CardContent>
        </Card>
      </AnimatedWrapper>
    </div>
  );
}
