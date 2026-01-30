require('dotenv').config({ path: '.env.local' });
const { GoogleGenerativeAI } = require("@google/generative-ai");

async function listModels() {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); // Dummy to init
        // Actually there isn't a direct listModels on the client instance often exposed easily in simple docs 
        // without using the API direct, but let's try to just run a simple generateContent with gemini-pro 
        // to see if it works, or use a known stable alias.
        // Better: use the specific 'gemini-1.5-flash-001' or 'gemini-pro'.

        // Changing approach: I will just try to run a generation with 'gemini-1.5-flash-001' which is more likely to exist.
        // Or 'gemini-pro'.
        console.log("Listing models via direct verification...");

        const models = ["gemini-1.5-flash", "gemini-1.5-flash-001", "gemini-pro", "gemini-1.0-pro"];

        for (const m of models) {
            console.log(`Testing ${m}...`);
            try {
                const model = genAI.getGenerativeModel({ model: m });
                await model.generateContent("Test");
                console.log(`SUCCESS: ${m} is available.`);
                break;
            } catch (e) {
                console.log(`FAILED: ${m} - ${e.message}`);
            }
        }

    } catch (error) {
        console.error("Error listing models:", error);
    }
}

listModels();
