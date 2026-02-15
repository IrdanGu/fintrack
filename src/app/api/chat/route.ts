import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ai, SYSTEM_PROMPT } from "@/lib/openai";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function callGemini(message: string, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      return await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: message,
        config: {
          systemInstruction: SYSTEM_PROMPT,
          temperature: 0.3,
          responseMimeType: "application/json",
        },
      });
    } catch (error: unknown) {
      const isRateLimit =
        error instanceof Error &&
        (error.message.includes("429") || error.message.includes("RESOURCE_EXHAUSTED"));
      if (isRateLimit && i < retries - 1) {
        await sleep(2000 * (i + 1)); // 2s, 4s, 6s backoff
        continue;
      }
      throw error;
    }
  }
  throw new Error("Max retries reached");
}

export async function GET() {
  const messages = await prisma.chatMessage.findMany({
    orderBy: { createdAt: "asc" },
    take: 100,
  });
  return NextResponse.json(messages);
}

export async function POST(request: NextRequest) {
  const { message } = await request.json();

  // Save user message
  await prisma.chatMessage.create({
    data: { role: "user", content: message },
  });

  try {
    const response = await callGemini(message);

    const rawText = response.text ?? "{}";
    // Strip markdown code blocks if present
    const responseText = rawText.replace(/^```(?:json)?\s*\n?/i, "").replace(/\n?```\s*$/i, "").trim();
    let parsed;

    try {
      parsed = JSON.parse(responseText);
    } catch {
      parsed = { expenses: [], income: [], message: responseText };
    }

    const { expenses = [], income = [], message: aiMessage = "Done!" } = parsed;

    // Save transactions to database
    const transactions = [
      ...expenses.map((e: { name: string; amount: number; category: string }) => ({
        type: "expense",
        name: e.name,
        amount: e.amount,
        category: e.category,
        date: new Date(),
      })),
      ...income.map((e: { name: string; amount: number; category: string }) => ({
        type: "income",
        name: e.name,
        amount: e.amount,
        category: e.category,
        date: new Date(),
      })),
    ];

    if (transactions.length > 0) {
      await prisma.transaction.createMany({ data: transactions });
    }

    // Build assistant response content
    const assistantContent = JSON.stringify({ expenses, income, message: aiMessage });

    // Save assistant message
    await prisma.chatMessage.create({
      data: { role: "assistant", content: assistantContent },
    });

    return NextResponse.json({
      expenses,
      income,
      message: aiMessage,
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Something went wrong";

    const fallbackContent = JSON.stringify({
      expenses: [],
      income: [],
      message: `Error: ${errorMessage}`,
    });

    await prisma.chatMessage.create({
      data: { role: "assistant", content: fallbackContent },
    });

    return NextResponse.json(
      { expenses: [], income: [], message: `Error: ${errorMessage}` },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  await prisma.chatMessage.deleteMany();
  return NextResponse.json({ success: true });
}
