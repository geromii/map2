import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// Initialize OpenAI with your API key
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body || !body.messages) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const messages = body.messages;

    // Create a chat completion request
    const chatCompletion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages,
    });

    // Respond with the chat completion result
    return NextResponse.json(chatCompletion);
  } catch (error) {
    console.error('Error handling request:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
