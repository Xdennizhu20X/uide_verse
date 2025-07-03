import type { Project } from '@/lib/types';

export const projects: Project[] = [
  {
    id: '1',
    title: 'Generador de Energía con Bicicleta',
    author: 'Gabriel Díaz y Jair Merchan',
    avatar: 'https://placehold.co/40x40.png',
    date: '2024-06-10',
    category: 'Energía Sostenible',
    technologies: ['Generador DC', 'Arduino', 'Reciclaje'],
    description: 'Un sistema que permite cargar dispositivos móviles utilizando la energía generada al pedalear una bicicleta. Ideal para promover la conciencia sobre el uso de energías limpias y renovables.',
    images: [
      '/bici.jpg',
    ],
    comments: [
      { id: 'c1', author: 'Lucía Ortega', text: '¡Increíble iniciativa para zonas rurales!' },
    ],
    isEco: true,
  },
  {
    id: '2',
    title: 'Instalación Artística con Tecnología Reciclada',
    author: 'Gabriel Ríos',
    avatar: 'https://placehold.co/40x40.png',
    date: '2024-05-22',
    category: 'Arte y Tecnología',
    technologies: ['LEDs reciclados', 'Motores viejos', 'Arduino'],
    description: 'Una instalación artística interactiva que utiliza componentes electrónicos reciclados para crear esculturas cinéticas y juegos de luces que responden al movimiento del espectador.',
    images: [
      '/reciclaje.jpg',
    ],
    comments: [
      { id: 'c2', author: 'Pedro Ríos', text: 'Creativo y sostenible. ¡Me encanta esta fusión de arte y tecnología!' },
    ],
    isEco: true,
  },
  {
    id: '3',
    title: 'Sistema de Monitoreo de Calidad del Aire',
    author: 'Ángel Sarango y Nicolás Cevallos',
    avatar: 'https://placehold.co/40x40.png',
    date: '2024-04-18',
    category: 'Salud y Medio Ambiente',
    technologies: ['IoT', 'Sensores MQ135', 'Python'],
    description: 'Un sistema portátil que mide la calidad del aire en tiempo real, mostrando los niveles de contaminantes como CO₂, amoníaco y partículas PM2.5, con alertas para zonas de riesgo.',
    images: [
        '/monitoreo.jpeg'
    ],
    comments: [
      { id: 'c3', author: 'Esteban Lara', text: '¡Muy útil para zonas urbanas con alta contaminación!' },
    ],
    isEco: true,
  },
  {
    id: '4',
    title: 'App de Reciclaje Gamificada',
    author: 'Michael Brown',
    avatar: 'https://placehold.co/40x40.png',
    date: '2024-05-01',
    category: 'Ecológico',
    technologies: ['React Native', 'Firebase'],
    description: 'Una aplicación móvil que fomenta el reciclaje a través de un sistema de recompensas basado en puntos y desafíos comunitarios. Los usuarios pueden escanear artículos para aprender a reciclarlos correctamente.',
    images: [
        '/app.jpg'
    ],
    comments: [],
    isEco: true,
  },
];
