import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
    const data = await req.json();

    const selection = await prisma.selection.create({
        data: {
        username: data.username,
        email: data.email,
        phone: data.phone,
        picks: data.picks,
        paymentProofUrl: data.paymentProofUrl,
        },
    });

    return NextResponse.json({ ok: true, id: selection.id });
}