"use client"

import { Line, LineChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from "recharts"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { AnimatedWrapper } from "@/components/animated-wrapper"
import { Wind, Gauge, Sun, Droplets, Thermometer, Cloud, Activity } from "lucide-react"
import { useEffect, useState } from "react"
import { ref, onValue, query, orderByChild, limitToLast } from "firebase/database"
import { signInAnonymously } from "firebase/auth"
import { airQualityDb, airQualityAuth } from "@/lib/firebase"

const DEVICE_ID = "B06B28B3A3A0"

interface SensorData {
  ts: string;
  co2?: number;
  humidity?: number;
  pm1?: number;
  pm10?: number;
  pm25?: number;
  pressure?: number;
  temperature?: number;
  tvoc?: number;
  uv?: number;
  quality?: {
    emoji: string;
    label: string;
    level: number;
  };
}

export default function AirQualityPage() {
  const [lastReading, setLastReading] = useState<SensorData | null>(null)
  const [sensorReadings, setSensorReadings] = useState<SensorData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const initFirebase = async () => {
      try {
        await signInAnonymously(airQualityAuth)
      } catch (e) {
        console.error("Error en autenticación anónima:", e)
      }
    }

    initFirebase()

    // Suscribirse al último dato
    const lastRef = ref(airQualityDb, `devices/${DEVICE_ID}/last`)
    const lastUnsubscribe = onValue(lastRef, (snap) => {
      setLastReading(snap.val())
      setLoading(false)
    })

    // Suscribirse a los últimos 10 registros
    const q = query(
      ref(airQualityDb, `devices/${DEVICE_ID}/readings`),
      orderByChild("ts"),
      limitToLast(10)
    )

    const historyUnsubscribe = onValue(q, (snap) => {
      const data = snap.val() ? Object.values(snap.val()) : []
      setSensorReadings(data as SensorData[])
    })

    return () => {
      lastUnsubscribe()
      historyUnsubscribe()
    }
  }, [])

  const chartData = sensorReadings
    .map(item => ({
      time: item.ts ? new Date(item.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--',
      pm25: item.pm25,
      pm10: item.pm10,
      co2: item.co2,
      tvoc: item.tvoc,
    }))
    .sort((a, b) => a.time.localeCompare(b.time));

  // Calcular calidad del aire basada en PM2.5
  const calculateAQI = (pm25: number | undefined) => {
    if (!pm25) return 0
    if (pm25 <= 12) return Math.round((50/12) * pm25)
    if (pm25 <= 35.4) return Math.round(50 + (49/23.4) * (pm25 - 12))
    if (pm25 <= 55.4) return Math.round(100 + (49/20) * (pm25 - 35.4))
    if (pm25 <= 150.4) return Math.round(150 + (99/95) * (pm25 - 55.4))
    return Math.round(200 + (pm25 - 150.4) * 1.111)
  }

  const currentAQI = calculateAQI(lastReading?.pm25)
  const aqiStatus = lastReading?.quality?.label || '--'

  return (
    <div className="container py-12 md:py-16">
      <AnimatedWrapper>
        <div className="text-center mb-12">
          <Activity className="mx-auto h-16 w-16 text-primary mb-4"/>
          <h1 className="text-4xl md:text-5xl font-bold font-headline text-primary">Panel Eco-SensorAir</h1>
          <p className="mt-4 text-lg text-muted-foreground max-w-3xl mx-auto">
            Datos en tiempo real del sensor. Última actualización: {lastReading?.ts ? 
              new Date(lastReading.ts).toLocaleTimeString() : 'cargando...'}
          </p>
        </div>
      </AnimatedWrapper>

      {loading ? (
        <div className="text-center py-12">Cargando datos del sensor...</div>
      ) : (
        <>
          {/* Sección de métricas principales */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
            <AnimatedWrapper delay={100}>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Calidad del Aire</CardTitle>
                  <Gauge className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{lastReading?.quality?.emoji} {aqiStatus}</div>
                  <p className="text-xs text-muted-foreground">ICA: {currentAQI}</p>
                  <p className="text-xs mt-1">PM2.5: {lastReading?.pm25?.toFixed(1) || '--'} µg/m³</p>
                </CardContent>
              </Card>
            </AnimatedWrapper>

            <AnimatedWrapper delay={200}>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Partículas PM10</CardTitle>
                  <Cloud className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{lastReading?.pm10?.toFixed(1) || '--'}</div>
                  <p className="text-xs text-muted-foreground">µg/m³</p>
                  <p className="text-xs mt-1">
                    {lastReading?.pm10 ? 
                      (lastReading.pm10 <= 50 ? 'Buena' : 
                       lastReading.pm10 <= 100 ? 'Moderada' : 'Elevada') : '--'}
                  </p>
                </CardContent>
              </Card>
            </AnimatedWrapper>

            <AnimatedWrapper delay={300}>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Dióxido de Carbono</CardTitle>
                  <Wind className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{lastReading?.co2?.toFixed(0) || '--'}</div>
                  <p className="text-xs text-muted-foreground">ppm</p>
                  <p className="text-xs mt-1">
                    {lastReading?.co2 ? 
                      (lastReading.co2 < 800 ? 'Bueno' : 
                       lastReading.co2 < 1200 ? 'Moderado' : 'Alto') : '--'}
                  </p>
                </CardContent>
              </Card>
            </AnimatedWrapper>

            <AnimatedWrapper delay={400}>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Comp. Orgánicos Volátiles</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{lastReading?.tvoc?.toFixed(0) || '--'}</div>
                  <p className="text-xs text-muted-foreground">ppb</p>
                  <p className="text-xs mt-1">
                    {lastReading?.tvoc ? 
                      (lastReading.tvoc < 250 ? 'Bueno' : 
                       lastReading.tvoc < 1000 ? 'Moderado' : 'Alto') : '--'}
                  </p>
                </CardContent>
              </Card>
            </AnimatedWrapper>
          </div>

          {/* Segunda fila de métricas */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
            <AnimatedWrapper delay={500}>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Temperatura</CardTitle>
                  <Thermometer className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{lastReading?.temperature?.toFixed(1) || '--'}</div>
                  <p className="text-xs text-muted-foreground">°C</p>
                  <p className="text-xs mt-1">
                    {lastReading?.temperature ? 
                      (lastReading.temperature < 15 ? 'Frío' : 
                       lastReading.temperature < 25 ? 'Agradable' : 'Cálido') : '--'}
                  </p>
                </CardContent>
              </Card>
            </AnimatedWrapper>

            <AnimatedWrapper delay={600}>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Humedad</CardTitle>
                  <Droplets className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{lastReading?.humidity?.toFixed(0) || '--'}</div>
                  <p className="text-xs text-muted-foreground">%</p>
                  <p className="text-xs mt-1">
                    {lastReading?.humidity ? 
                      (lastReading.humidity < 30 ? 'Seco' : 
                       lastReading.humidity < 60 ? 'Confortable' : 'Húmedo') : '--'}
                  </p>
                </CardContent>
              </Card>
            </AnimatedWrapper>

            <AnimatedWrapper delay={700}>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Índice UV</CardTitle>
                  <Sun className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{lastReading?.uv?.toFixed(1) || '--'}</div>
                  <p className="text-xs text-muted-foreground">
                    {lastReading?.uv ? 
                      (lastReading.uv <= 2 ? 'Bajo' : 
                       lastReading.uv <= 5 ? 'Moderado' : 
                       lastReading.uv <= 7 ? 'Alto' : 'Muy alto') : '--'}
                  </p>
                </CardContent>
              </Card>
            </AnimatedWrapper>

            <AnimatedWrapper delay={800}>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Presión Atmosférica</CardTitle>
                  <Gauge className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{lastReading?.pressure?.toFixed(0) || '--'}</div>
                  <p className="text-xs text-muted-foreground">hPa</p>
                  <p className="text-xs mt-1">
                    {lastReading?.pressure ? 
                      (lastReading.pressure < 1000 ? 'Baja' : 
                       lastReading.pressure < 1020 ? 'Normal' : 'Alta') : '--'}
                  </p>
                </CardContent>
              </Card>
            </AnimatedWrapper>
          </div>

          {/* Gráfico de tendencias */}
          <AnimatedWrapper delay={900}>
            <Card>
              <CardHeader>
                <CardTitle>Tendencias (Últimos 10 registros)</CardTitle>
                <CardDescription>Variación de los parámetros principales</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={chartData}>
                    <XAxis dataKey="time" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--background))',
                        borderColor: 'hsl(var(--border))'
                      }}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="pm25" 
                      name="PM2.5 (µg/m³)" 
                      stroke="#8884d8" 
                      strokeWidth={2} 
                      dot={{ r: 4 }} 
                      activeDot={{ r: 8 }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="pm10" 
                      name="PM10 (µg/m³)" 
                      stroke="#82ca9d" 
                      strokeWidth={2} 
                      dot={{ r: 4 }} 
                      activeDot={{ r: 8 }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="co2" 
                      name="CO₂ (ppm)" 
                      stroke="#ffc658" 
                      strokeWidth={2} 
                      dot={{ r: 4 }} 
                      activeDot={{ r: 8 }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="tvoc" 
                      name="TVOC (ppb)" 
                      stroke="#ff8042" 
                      strokeWidth={2} 
                      dot={{ r: 4 }} 
                      activeDot={{ r: 8 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </AnimatedWrapper>

          {/* Datos completos */}
          <AnimatedWrapper delay={1000} className="mt-8">
            <Card>
              <CardHeader>
                <CardTitle>Datos Completos del Sensor</CardTitle>
                <CardDescription>Últimos 10 registros del sensor Eco-SensorAir</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hora</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PM2.5</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PM10</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CO₂</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">TVOC</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Temp.</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hum.</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">UV</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Presión</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {[...sensorReadings].reverse().map((reading, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {reading.ts ? new Date(reading.ts).toLocaleTimeString() : '--'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{reading.pm25?.toFixed(1) || '--'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{reading.pm10?.toFixed(1) || '--'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{reading.co2?.toFixed(0) || '--'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{reading.tvoc?.toFixed(0) || '--'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{reading.temperature?.toFixed(1) || '--'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{reading.humidity?.toFixed(0) || '--'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{reading.uv?.toFixed(1) || '--'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{reading.pressure?.toFixed(0) || '--'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </AnimatedWrapper>
        </>
      )}
    </div>
  )
}