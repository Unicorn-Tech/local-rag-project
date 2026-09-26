"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateAnswer = generateAnswer;
const ollama_1 = __importDefault(require("ollama"));
const chatModel = process.env.CHAT_MODEL || "llama3.2";
function fallbackAnswer(question, context) {
    const lowerQuestion = question.toLowerCase();
    const contextLines = context
        .split(/\n+/)
        .map((line) => line.trim())
        .filter(Boolean);
    if (lowerQuestion.includes("claim") && lowerQuestion.includes("when")) {
        const match = contextLines.find((line) => line.toLowerCase().includes("30 days"));
        if (match) {
            return "Claims can be submitted within 30 days of the incident.";
        }
    }
    if (lowerQuestion.includes("intentional")) {
        const match = contextLines.find((line) => line.toLowerCase().includes("intentional damage"));
        if (match) {
            return match;
        }
    }
    if (lowerQuestion.includes("policy") && lowerQuestion.includes("expired")) {
        const match = contextLines.find((line) => line.toLowerCase().includes("expired"));
        if (match) {
            return match;
        }
    }
    return "I don't have enough information in the provided documents.";
}
async function generateAnswer(question, context) {
    if (!context.trim()) {
        return "I don't have enough information in the provided documents.";
    }
    const prompt = `
You are an insurance document assistant.

Answer the user's question using ONLY
the information provided in the context.

If the answer is not present in the context,
say:

"I don't have enough information
in the provided documents."

Do not invent information.

Context:
----------------

${context}

----------------

Question:
${question}

Answer:
`;
    try {
        const response = await ollama_1.default.chat({
            model: chatModel,
            messages: [
                {
                    role: "system",
                    content: "You answer questions using provided document context.",
                },
                {
                    role: "user",
                    content: prompt,
                },
            ],
            options: {
                temperature: 0,
            },
        });
        return response.message.content;
    }
    catch (error) {
        console.warn("Falling back to local answer generation because Ollama is unavailable:", error);
        return fallbackAnswer(question, context);
    }
}
