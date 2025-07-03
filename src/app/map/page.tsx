import { Card } from '@/components/ui/card';
import { AnimatedWrapper } from '@/components/animated-wrapper';
import { MapPin, Trash2, Battery, GlassWater } from 'lucide-react';

export default function InteractiveMapPage() {
  return (
    <div className="container py-12 md:py-16">
      <AnimatedWrapper>
        <div className="text-center mb-12">
            <MapPin className="mx-auto h-16 w-16 text-primary mb-4"/>
            <h1 className="text-4xl md:text-5xl font-bold font-headline text-primary">Interactive Recycling Map</h1>
            <p className="mt-4 text-lg text-muted-foreground max-w-3xl mx-auto">
              Find recycling points across the city. Help us keep our environment clean by disposing of waste correctly.
            </p>
        </div>
      </AnimatedWrapper>

      <AnimatedWrapper delay={200}>
        <Card>
            <div className="grid lg:grid-cols-4">
                <div className="lg:col-span-3">
                    <img
                        src="https://placehold.co/1200x800.png"
                        alt="City map with recycling points"
                        data-ai-hint="city map"
                        className="w-full h-[600px] object-cover rounded-l-lg"
                    />
                </div>
                <div className="lg:col-span-1 p-6 bg-secondary/30 rounded-r-lg">
                    <h2 className="text-2xl font-bold mb-4 font-headline">Locations</h2>
                    <ul className="space-y-4">
                        <li className="flex items-center gap-3 p-3 rounded-lg hover:bg-background transition-colors cursor-pointer">
                            <Trash2 className="h-5 w-5 text-primary" />
                            <div>
                                <h3 className="font-semibold">Central Park - General Waste</h3>
                                <p className="text-xs text-muted-foreground">Main Entrance</p>
                            </div>
                        </li>
                        <li className="flex items-center gap-3 p-3 rounded-lg hover:bg-background transition-colors cursor-pointer">
                            <Battery className="h-5 w-5 text-destructive" />
                            <div>
                                <h3 className="font-semibold">City Library - Batteries</h3>
                                <p className="text-xs text-muted-foreground">2nd Floor, Electronics section</p>
                            </div>
                        </li>
                        <li className="flex items-center gap-3 p-3 rounded-lg hover:bg-background transition-colors cursor-pointer">
                            <GlassWater className="h-5 w-5 text-primary" />
                            <div>
                                <h3 className="font-semibold">University Campus - Plastic & Glass</h3>
                                <p className="text-xs text-muted-foreground">Near cafeteria</p>
                            </div>
                        </li>
                        <li className="flex items-center gap-3 p-3 rounded-lg hover:bg-background transition-colors cursor-pointer">
                            <Trash2 className="h-5 w-5 text-primary" />
                            <div>
                                <h3 className="font-semibold">North Plaza - General Waste</h3>
                                <p className="text-xs text-muted-foreground">Next to fountain</p>
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
