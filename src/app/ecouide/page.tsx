"use client"

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AnimatedWrapper } from "@/components/animated-wrapper"
import { Leaf, Recycle, Lightbulb, MapPin, Wind } from "lucide-react"
import { ProjectCard } from "@/components/project-card"
import { projects } from "@/lib/data"
import Link from "next/link"

const chartData = [
  { name: "Ene", total: 4 },
  { name: "Feb", total: 3 },
  { name: "Mar", total: 5 },
  { name: "Abr", total: 2 },
  { name: "May", total: 6 },
  { name: "Jun", total: 4 },
]

export default function EcoUidePage() {
    const ecoProjects = projects.filter(p => p.isEco);

  return (
    <>
      <section className="relative flex h-[60vh] min-h-[400px] items-center justify-center text-center">
        <div className="container relative z-10">
          <AnimatedWrapper>
            <Leaf className="mx-auto h-20 w-20 text-primary mb-4 drop-shadow-md"/>
            <h1 className="text-5xl md:text-7xl font-bold font-headline text-primary drop-shadow-md">
              Bienvenido a EcoUide
            </h1>
            <p className="mt-4 text-lg md:text-xl text-foreground/90 max-w-3xl mx-auto drop-shadow-sm">
                Un espacio especial dedicado a proyectos que contribuyen a un futuro más verde y sostenible. Innovemos por nuestro planeta.
            </p>
          </AnimatedWrapper>
        </div>
      </section>
      
      <div className="container py-12 md:py-16">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-12">
            <AnimatedWrapper delay={0}>
                <Card className="h-full transition-transform duration-300 hover:scale-105 hover:shadow-lg">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total de Proyectos Eco</CardTitle>
                    <Recycle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                    <div className="text-2xl font-bold">{ecoProjects.length}</div>
                    <p className="text-xs text-muted-foreground">Innovaciones para un mañana mejor</p>
                    </CardContent>
                </Card>
            </AnimatedWrapper>
            <AnimatedWrapper delay={100}>
                <Card className="h-full transition-transform duration-300 hover:scale-105 hover:shadow-lg">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Colaboradores</CardTitle>
                    <Lightbulb className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                    <div className="text-2xl font-bold">+{new Set(ecoProjects.map(p => p.author)).size}</div>
                    <p className="text-xs text-muted-foreground">Creadores que marcan la diferencia</p>
                    </CardContent>
                </Card>
            </AnimatedWrapper>
            <AnimatedWrapper delay={200}>
                 <Link href="/ecouide/air-quality" className="block h-full">
                    <Card className="h-full hover:bg-card/80 transition-colors transition-transform duration-300 hover:scale-105 hover:shadow-lg">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Calidad del Aire</CardTitle>
                            <Wind className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">Ver Panel</div>
                            <p className="text-xs text-muted-foreground">Monitorea los indicadores de la ciudad</p>
                        </CardContent>
                    </Card>
                </Link>
            </AnimatedWrapper>
            <AnimatedWrapper delay={300}>
                <Link href="/ecouide/map" className="block h-full">
                    <Card className="h-full hover:bg-card/80 transition-colors transition-transform duration-300 hover:scale-105 hover:shadow-lg">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Mapa Interactivo</CardTitle>
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">Ver Mapa</div>
                            <p className="text-xs text-muted-foreground">Encuentra puntos de reciclaje</p>
                        </CardContent>
                    </Card>
                </Link>
            </AnimatedWrapper>
        </div>

        <AnimatedWrapper delay={400}>
            <Card className="mb-12">
                <CardHeader>
                    <CardTitle>Envíos Mensuales de Proyectos Eco</CardTitle>
                </CardHeader>
                <CardContent className="pl-2">
                <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={chartData}>
                    <XAxis
                        dataKey="name"
                        stroke="#888888"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                    />
                    <YAxis
                        stroke="#888888"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => `${value}`}
                    />
                    <Bar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
                </CardContent>
            </Card>
        </AnimatedWrapper>
        
        <div>
            <h2 className="text-3xl font-bold font-headline mb-8 text-center">Proyectos Ecológicos Destacados</h2>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {ecoProjects.map((project, index) => (
                    <AnimatedWrapper key={project.id} delay={100 * (index % 3)}>
                        <ProjectCard project={project} />
                    </AnimatedWrapper>
                ))}
            </div>
        </div>
    </div>
    </>
  )
}
