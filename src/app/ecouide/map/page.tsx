import { Card } from '@/components/ui/card';
import { AnimatedWrapper } from '@/components/animated-wrapper';
import { MapPin, Trash2, Battery, GlassWater } from 'lucide-react';

export default function InteractiveMapPage() {
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

      <AnimatedWrapper delay={200}>
        <Card>
            <div className="grid lg:grid-cols-4">
                <div className="lg:col-span-3">
                    <img
                        src="https://placehold.co/1200x800.png"
                        alt="Mapa de la ciudad con puntos de reciclaje"
                        data-ai-hint="city map"
                        className="w-full h-[600px] object-cover rounded-l-lg"
                    />
                </div>
                <div className="lg:col-span-1 p-6 bg-secondary/30 rounded-r-lg">
                    <h2 className="text-2xl font-bold mb-4 font-headline">Ubicaciones</h2>
                    <ul className="space-y-4">
                        <li className="flex items-center gap-3 p-3 rounded-lg hover:bg-background transition-colors cursor-pointer">
                            <Trash2 className="h-5 w-5 text-primary" />
                            <div>
                                <h3 className="font-semibold">Parque Central - Residuos Generales</h3>
                                <p className="text-xs text-muted-foreground">Entrada Principal</p>
                            </div>
                        </li>
                        <li className="flex items-center gap-3 p-3 rounded-lg hover:bg-background transition-colors cursor-pointer">
                            <Battery className="h-5 w-5 text-destructive" />
                            <div>
                                <h3 className="font-semibold">Biblioteca Municipal - Baterías</h3>
                                <p className="text-xs text-muted-foreground">2º Piso, sección de electrónica</p>
                            </div>
                        </li>
                        <li className="flex items-center gap-3 p-3 rounded-lg hover:bg-background transition-colors cursor-pointer">
                            <GlassWater className="h-5 w-5 text-primary" />
                            <div>
                                <h3 className="font-semibold">Campus Universitario - Plástico y Vidrio</h3>
                                <p className="text-xs text-muted-foreground">Cerca de la cafetería</p>
                            </div>
                        </li>
                        <li className="flex items-center gap-3 p-3 rounded-lg hover:bg-background transition-colors cursor-pointer">
                            <Trash2 className="h-5 w-5 text-primary" />
                            <div>
                                <h3 className="font-semibold">Plaza Norte - Residuos Generales</h3>
                                <p className="text-xs text-muted-foreground">Junto a la fuente</p>
                            </div>
                        </li>
                    </ul>
                </div>
            </div>
        </Card>
      </AnimatedWrapper>
    </div>
  );
}
