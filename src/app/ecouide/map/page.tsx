'use client';

import { Card } from '@/components/ui/card';
import { AnimatedWrapper } from '@/components/animated-wrapper';
import { MapPin, Trash2, Battery, GlassWater } from 'lucide-react';
import { useState, useMemo } from 'react';
import dynamic from 'next/dynamic';

const locations = [
  {
    id: 'contenedor-municipal-basura',
    name: 'Contenedor Municipal Basura - Mercado Gran Colombia & Mayorista',
    position: [-3.985582571658209, -79.20278958239881],
    
    icon: <Trash2 className="h-5 w-5 text-primary" />
  },
  {
    id: 'centro-gestion-residuos',
    name: 'Centro de Gestión Integral de Residuos Solidos de Loja',
    position: [-4.030523681598718, -79.22054362759981],
    
    icon: <Battery className="h-5 w-5 text-destructive" />
  },
  {
    id: 'recicladora-ecomundo',
    name: 'RECICLADORA ECOMUNDO',
    position: [-3.9758985367211173, -79.22879975590902],
    
    icon: <GlassWater className="h-5 w-5 text-primary" />
  },
  {
    id: 'recicladora-nuevo-comienzo',
    name: 'RECICLADORA NUEVO COMIENZO',
    position: [-3.9770437585108622, -79.23009794504654],
    
    icon: <Trash2 className="h-5 w-5 text-primary" />
  },
  {
    id: 'centro-gestion-integral-loja',
    name: 'Centro De Gestión Integral Loja',
    position: [-4.026246159951451, -79.22345460248108],
    description: 'Por punzara',
    icon: <Trash2 className="h-5 w-5 text-primary" />
  },
];

const Map = dynamic(() => import('@/components/ui/map').then(mod => mod.Map), {
  loading: () => <div className="w-full h-[600px] bg-secondary/30 rounded-l-lg flex items-center justify-center"><p>Cargando mapa...</p></div>,
  ssr: false
});

export default function InteractiveMapPage() {
  const [selectedPosition, setSelectedPosition] = useState<[number, number] | null>(null);

  return (
    <div className="container py-12 md:py-16">
      <AnimatedWrapper>
        <div className="text-center mb-12">
            <MapPin className="mx-auto h-16 w-16 text-primary mb-4"/>
            <h1 className="text-4xl md:text-5xl font-bold font-headline text-primary">Mapa de Reciclaje Interactivo</h1>
            <p className="mt-4 text-lg text-muted-foreground max-w-3xl mx-auto">
              Encuentra puntos de reciclaje por la ciudad. Ayúdanos a mantener nuestro entorno limpio desechando los residuos correctamente.
            </p>
        </div>
      </AnimatedWrapper>

      <Card>
            <div className="grid lg:grid-cols-4">
                <div className="lg:col-span-3">
                    <Map locations={locations} selectedPosition={selectedPosition} />
                </div>
                <div className="lg:col-span-1 p-6 bg-secondary/30 rounded-r-lg">
                    <h2 className="text-2xl font-bold mb-4 font-headline">Ubicaciones</h2>
                    <ul className="space-y-4">
                        {locations.map((location) => (
                            <li key={location.id} onClick={() => setSelectedPosition(location.position)} className="flex items-center gap-3 p-3 rounded-lg hover:bg-background transition-colors cursor-pointer">
                                {location.icon}
                                <div>
                                    <h3 className="font-semibold">{location.name}</h3>
                                    <p className="text-xs text-muted-foreground">{location.description}</p>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </Card>
    </div>
  );
}
