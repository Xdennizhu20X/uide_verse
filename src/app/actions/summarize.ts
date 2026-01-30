'use server';

import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

interface ProjectData {
    title: string;
    description: string;
    technologies: string[];
    category: string;
    author: string;
}

export async function summarizeProject(project: ProjectData): Promise<string> {
    if (!process.env.GEMINI_API_KEY) {
        return "Error: API Key de Gemini no configurada.";
    }

    try {
        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
            generationConfig: {
                temperature: 0.7,
            }
        });

        const prompt = `
      Eres un experto en comunicación técnica y marketing de proyectos universitarios.
      Tu tarea es generar un RESUMEN EJECUTIVO atractivo y conciso (máximo 3 frases) para el siguiente proyecto.

      Detalles del Proyecto:
      - Título: ${project.title}
      - Categoría: ${project.category}
      - Tecnologías: ${project.technologies.join(", ")}
      - Autor: ${project.author}
      - Descripción Original: "${project.description}"

      Instrucciones:
      1. El resumen debe destacar el problema que resuelve y la solución tecnológica.
      2. Usa un tono profesional pero inspirador.
      3. No uses frases como "Este proyecto se trata de", ve directo al grano.
      4. Si el proyecto es ecológico, resalta el impacto ambiental.
      
      Resumen:
    `;

        const result = await model.generateContent(prompt);
        const response = result.response;
        return response.text();
    } catch (error: any) {
        console.error("Error generating summary with Gemini:", error);

        if (error.status === 429 || error.message?.includes('429')) {
            return "El servicio de IA está muy solicitado ahora (Cuota excedida). Por favor intenta en unos segundos.";
        }

        return "No se pudo generar el resumen en este momento. Inténtalo más tarde.";
    }
}
