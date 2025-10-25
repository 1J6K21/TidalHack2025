import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';

if (!apiKey) {
  console.warn('NEXT_PUBLIC_GEMINI_API_KEY is not configured. AI features will not work.');
}

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(apiKey);

// Get the generative model
export const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

export default genAI;