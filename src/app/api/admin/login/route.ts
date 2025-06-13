import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"

const JWT_SECRET = process.env.JWT_SECRET || "supersecret"

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
    const { username, password } = await req.json()
    const user = await prisma.user.findUnique({ where: { username } })
    if (!user) return NextResponse.json({ error: "Usuario incorrecto" }, { status: 401 })

    const valid = await bcrypt.compare(password, user.password)
    if (!valid) return NextResponse.json({ error: "Contraseña incorrecta" }, { status: 401 })

    const token = jwt.sign({ userId: user.id, username: user.username }, JWT_SECRET, { expiresIn: "1d" })
    return NextResponse.json({ token })
}