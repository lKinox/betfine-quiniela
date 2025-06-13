"use client"
import { useState } from "react"

export default function AdminLogin() {
    const [username, setUsername] = useState("")
    const [password, setPassword] = useState("")
    const [error, setError] = useState("")

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setError("")
        const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
        })
        const data = await res.json()
        if (!res.ok) {
        setError(data.error || "Credenciales inválidas")
        return
        }
        localStorage.setItem("admin_token", data.token)
        window.location.href = "/admin"
    }

    return (
        <main className="flex h-screen items-center justify-center bg-gray-100">
        <form onSubmit={handleSubmit} className="bg-white p-8 rounded shadow w-full max-w-md flex flex-col gap-4">
            <h2 className="text-2xl font-bold mb-4">Admin Login</h2>
            <input
            className="border px-3 py-2 rounded"
            placeholder="Usuario"
            value={username}
            onChange={e => setUsername(e.target.value)}
            />
            <input
            className="border px-3 py-2 rounded"
            placeholder="Contraseña"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            />
            {error && <div className="text-red-600 text-sm">{error}</div>}
            <button type="submit" className="bg-blue-600 text-white py-2 rounded font-bold">Entrar</button>
        </form>
        </main>
    )
    }