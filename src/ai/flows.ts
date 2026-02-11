import { z } from 'genkit';
import { ai } from './genkit';

export const generateProjectDescriptionFlow = ai.defineFlow(
    {
        name: 'generateProjectDescription',
        inputSchema: z.object({
            title: z.string(),
            category: z.string(),
            technologies: z.string(),
            currentDescription: z.string().optional(),
        }),
        outputSchema: z.object({
            description: z.string(),
        }),
    },
    async (input) => {
        const { title, category, technologies, currentDescription } = input;

        const prompt = `
      Actúa como un asistente académico experto en redacción de proyectos universitarios.
      Tu tarea es generar una descripción profesional, clara y atractiva para un proyecto estudiantil.

      Detalles del proyecto:
      - Título: ${title}
      - Categoría: ${category}
      - Tecnologías/Herramientas: ${technologies}
      ${currentDescription ? `- Borrador actual: ${currentDescription}` : ''}

      Instrucciones:
      1. Genera una descripción de 2 a 3 párrafos.
      2. Usa un tono formal pero entusiasta, adecuado para un portafolio académico o profesional.
      3. Destaca la innovación, el impacto potencial y el uso de las tecnologías mencionadas.
      4. Si hay un borrador actual, mejóralo y expándelo. Si no, crea uno desde cero basado en el título y las herramientas.
      5. NO incluyas saludos ni frases introductorias como "Aquí tienes la descripción". Solo el texto de la descripción.
    `;

        const { text } = await ai.generate(prompt);

        return { description: text };
    }
);
