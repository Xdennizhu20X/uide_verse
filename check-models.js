require('dotenv').config({ path: '.env.local' });
const { GoogleGenerativeAI } = require("@google/generative-ai");

async function checkModels() {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    const candidates = [
        "gemini-1.5-flash",
        "gemini-1.5-flash-latest",
        "gemini-1.5-flash-001",
        "gemini-1.5-flash-002",
        "gemini-1.5-pro",
        "gemini-1.5-pro-latest",
        "gemini-1.0-pro",
        "gemini-pro"
    ];

    console.log("Checking models availability with API Key: " + process.env.GEMINI_API_KEY.substring(0, 10) + "...");

    for (const modelName of candidates) {
        process.stdout.write(`Testing ${modelName.padEnd(25)} ... `);
        try {
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent("Hello, are you there?");
            const response = await result.response;
            console.log(`✅ OK! Response: ${response.text().substring(0, 20)}...`);
            // If one works, we usually prefer the newest flash for speed, but ultimately any working one is better than none.
            // We will continue to see all options.
        } catch (error) {
            if (error.message.includes("404")) {
                console.log(`❌ 404 Not Found`);
            } else {
                console.log(`❌ Error: ${error.message.split('\n')[0]}`);
            }
        }
    }
}

checkModels();
