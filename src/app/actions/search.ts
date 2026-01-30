'use server';

import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export interface SearchIntent {
    technologies: string[];
    categories: string[];
    keywords: string[];
    explanation?: string;
}

export async function analyzeSearchIntent(query: string): Promise<SearchIntent> {
    if (!process.env.GEMINI_API_KEY) {
        console.warn("GEMINI_API_KEY not found");
        return { technologies: [], categories: [], keywords: [query] };
    }

    try {
        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash", // Updated to Jan 2026 Free Tier model
            generationConfig: { responseMimeType: "application/json" }
        });

        const prompt = `
      Eres un asistente experto en clasificación de proyectos de tecnología universitarios.
      Tu tarea es analizar la consulta de búsqueda de un usuario para filtrar una base de datos de proyectos.
      
      Consulta del usuario: "${query}"
      
      Categorías disponibles en el sistema: "App Móvil", "Web", "IoT", "Inteligencia Artificial", "Data Science", "Ciberseguridad", "Videojuegos", "Otro".
      
      Instrucciones:
      1. Identifica las tecnologías mencionadas o implícitas (ej: "app" -> [Flutter, React Native], "web" -> [React, Next.js], "inteligencia" -> [Python, TensorFlow]).
      2. Asigna una o más "categories" si el usuario menciona algo relacionado.
      3. Extrae "keywords" CENTRALES. Si dice "estoy buscando un proyecto shuar", la keyword es "shuar". IGNORA palabras vacías.
      4. Si el término es genérico como "ecologico", incluye sinónimos como "sostenible", "ambiente", "reciclaje".
      
      Retorna un objeto JSON con esta estructura:
      {
        "technologies": ["string"], 
        "categories": ["string"],
        "keywords": ["string"]
      }
    `;

        const result = await model.generateContent(prompt);
        const response = result.response;
        const text = response.text();
        console.log("Gemini Raw Response:", text); // Debug log

        const data = JSON.parse(text) as SearchIntent;
        return data;
    } catch (error) {
        console.error("Error analyzing search intent with Gemini:", error);

        // Improved Fallback: Tokenize the query
        // Remove stop words and split into individual keywords
        const stopWords = ["el", "la", "los", "las", "un", "una", "unos", "unas", "de", "del", "que", "en", "y", "a", "o",
            "estoy", "buscando", "quiero", "ver", "proyecto", "proyectos", "sobre", "necesito", "tienes", "busco", "algun", "alguno", "hay"];
        const fallbackKeywords = query
            .toLowerCase()
            .split(/\s+/)
            .filter(word => !stopWords.includes(word) && word.length > 2);

        return { technologies: [], categories: [], keywords: fallbackKeywords };
    }
}
