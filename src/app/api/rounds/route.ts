import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
    const rounds = await prisma.rounds.findMany();
    // Devuelve los rounds como { "Ronda 1": {events: [...]}, "Ronda 2": {...} }
    const data = Object.fromEntries(rounds.map(r => [r.round, r.data]));
    return NextResponse.json(data);
}