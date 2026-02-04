'use client';

import { AnimatedWrapper } from '@/components/animated-wrapper';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { auth } from '@/lib/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Eye, EyeOff, Mail, Lock, AlertCircle, Loader2, CheckCircle, X } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);

  // Auto-hide success alert after 3 seconds
  useEffect(() => {
    if (showSuccessAlert) {
      const timer = setTimeout(() => {
        setShowSuccessAlert(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showSuccessAlert]);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Mostrar alerta de éxito
      setShowSuccessAlert(true);

      // Redirigir después de 1 segundo
      setTimeout(() => {
        router.push('/');
      }, 1000);

    } catch (error: any) {
      // Feedback específico de error
      const errorMessages: Record<string, string> = {
        'auth/invalid-credential': 'Correo o contraseña incorrectos',
        'auth/user-not-found': 'No existe una cuenta con este correo',
        'auth/wrong-password': 'Contraseña incorrecta',
        'auth/too-many-requests': 'Demasiados intentos. Intenta más tarde',
        'auth/network-request-failed': 'Error de conexión. Verifica tu internet',
      };
      const errorMessage = errorMessages[error.code] || 'Error al iniciar sesión. Intenta de nuevo';
      setError(errorMessage);

      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container flex min-h-[calc(100vh-4rem)] items-center justify-center py-12 px-4">
      {/* Alerta de éxito personalizada */}
      {showSuccessAlert && (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-5 fade-in duration-300">
          <div
            className="flex items-center gap-3 rounded-lg p-4 pr-12 shadow-2xl border-2 min-w-[320px]"
            style={{
              backgroundColor: '#f0a800',
              borderColor: '#d89500',
            }}
          >
            <CheckCircle className="h-6 w-6 shrink-0" style={{ color: '#1a1a1a' }} />
            <div>
              <p className="font-bold text-base" style={{ color: '#1a1a1a' }}>
                ¡Bienvenido de vuelta!
              </p>
              <p className="text-sm font-medium" style={{ color: '#1a1a1a' }}>
                Has iniciado sesión exitosamente
              </p>
            </div>
            <button
              onClick={() => setShowSuccessAlert(false)}
              className="absolute right-2 top-2 rounded-md p-1 hover:bg-black/10 transition-colors"
              style={{ color: '#1a1a1a' }}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      <AnimatedWrapper>
        <Card className="mx-auto w-full max-w-md shadow-lg">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-3xl font-bold tracking-tight">
              Bienvenido de nuevo
            </CardTitle>
            <CardDescription className="text-base">
              Ingresa tus credenciales para acceder a tu cuenta
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-5">
              {/* Mensaje de error visible */}
              {error && (
                <div
                  className="flex items-start gap-3 rounded-lg p-4 border-2"
                  style={{
                    backgroundColor: '#fee2e2',
                    borderColor: '#ef4444',
                    color: '#7f1d1d'
                  }}
                >
                  <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" style={{ color: '#dc2626' }} />
                  <p className="font-semibold text-sm leading-relaxed">{error}</p>
                </div>
              )}

              {/* Campo de email con icono */}
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

              {/* Campo de contraseña con toggle de visibilidad */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-sm font-medium">
                    Contraseña
                  </Label>
                  <Link
                    href="#"
                    className="text-sm text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
                    tabIndex={isLoading ? -1 : 0}
                  >
                    ¿Olvidaste tu contraseña?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="password"
                    placeholder="**************"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                    className="pl-10 pr-10 h-11"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded p-0.5"
                    aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Botón de submit con estado de carga */}
              <Button
                type="submit"
                className="w-full h-11 text-base font-medium"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Iniciando sesión...
                  </>
                ) : (
                  'Iniciar Sesión'
                )}
              </Button>
            </form>

            {/* Separador visual */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">
                  ¿Primera vez aquí?
                </span>
              </div>
            </div>

            {/* Link de registro destacado */}
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                ¿No tienes una cuenta?{' '}
                <Link
                  href="/register"
                  className="font-semibold text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
                >
                  Crear cuenta gratis
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </AnimatedWrapper>
    </div>
  );
}