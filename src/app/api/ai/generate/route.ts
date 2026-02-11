import { generateProjectDescriptionFlow } from '@/ai/flows';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { title, category, technologies, currentDescription } = body;

        const result = await generateProjectDescriptionFlow({
            title,
            category,
            technologies,
            currentDescription,
        });

        return NextResponse.json(result);
    } catch (error: any) {
        console.error('Error generating description:', error);
        return NextResponse.json(
            { error: 'Failed to generate description', details: error.message },
            { status: 500 }
        );
    }
}
