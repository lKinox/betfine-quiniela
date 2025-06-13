import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import jwt from "jsonwebtoken"

const JWT_SECRET = process.env.JWT_SECRET || "supersecret"
const prisma = new PrismaClient()

function verifyAuth(req: NextRequest) {
    const token = req.headers.get("authorization")?.replace("Bearer ", "")
    if (!token) return null
    try {
        return jwt.verify(token, JWT_SECRET)
    } catch {
        return null
    }
}

export async function GET(req: NextRequest) {
    const auth = verifyAuth(req)
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const tickets = await prisma.selection.findMany({
        orderBy: { createdAt: "desc" }
    })
    return NextResponse.json({ tickets })
}