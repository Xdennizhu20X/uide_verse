"use client"

import { Line, LineChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { AnimatedWrapper } from "@/components/animated-wrapper"
import { Wind, Gauge, Sun, Droplets } from "lucide-react"

const aqiData = [
  { time: "12 AM", aqi: 45 },
  { time: "3 AM", aqi: 48 },
  { time: "6 AM", aqi: 55 },
  { time: "9 AM", aqi: 62 },
  { time: "12 PM", aqi: 70 },
  { time: "3 PM", aqi: 65 },
  { time: "6 PM", aqi: 58 },
  { time: "9 PM", aqi: 52 },
]

export default function AirQualityPage() {
  return (
     <div className="container py-12 md:py-16">
        <AnimatedWrapper>
            <div className="text-center mb-12">
                <Wind className="mx-auto h-16 w-16 text-primary mb-4"/>
                <h1 className="text-4xl md:text-5xl font-bold font-headline text-primary">Panel de Calidad del Aire</h1>
                <p className="mt-4 text-lg text-muted-foreground max-w-3xl mx-auto">
                  Indicadores de calidad del aire en tiempo real para nuestra ciudad. Mantente informado sobre el aire que respiras.
                </p>
            </div>
        </AnimatedWrapper>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
            <AnimatedWrapper delay={100}>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">ICA (US)</CardTitle>
                        <Gauge className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">68</div>
                        <p className="text-xs text-muted-foreground">Moderado</p>
                    </CardContent>
                </Card>
            </AnimatedWrapper>
             <AnimatedWrapper delay={200}>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Índice UV</CardTitle>
                        <Sun className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">5</div>
                        <p className="text-xs text-muted-foreground">Moderado</p>
                    </CardContent>
                </Card>
            </AnimatedWrapper>
             <AnimatedWrapper delay={300}>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Humedad</CardTitle>
                        <Droplets className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">72%</div>
                        <p className="text-xs text-muted-foreground">Confortable</p>
                    </CardContent>
                </Card>
            </AnimatedWrapper>
             <AnimatedWrapper delay={400}>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Viento</CardTitle>
                        <Wind className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">12 km/h</div>
                        <p className="text-xs text-muted-foreground">Brisa suave</p>
                    </CardContent>
                </Card>
            </AnimatedWrapper>
        </div>

        <AnimatedWrapper delay={500}>
            <Card>
                <CardHeader>
                    <CardTitle>Tendencia del ICA (Hoy)</CardTitle>
                    <CardDescription>Índice de Calidad del Aire en las últimas 24 horas.</CardDescription>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={350}>
                        <LineChart data={aqiData}>
                            <XAxis dataKey="time" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'hsl(var(--background))',
                                    borderColor: 'hsl(var(--border))'
                                }}
                            />
                            <Line type="monotone" dataKey="aqi" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4, fill: "hsl(var(--primary))" }} activeDot={{ r: 8 }}/>
                        </LineChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        </AnimatedWrapper>
    </div>
  )
}
