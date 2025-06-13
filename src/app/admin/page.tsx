"use client"
import { useEffect, useState } from "react"

type Pick = {
  eventId: number
  pick: string
  homeTeam: string
  awayTeam: string
}

type Ticket = {
  id: string
  username: string
  email: string
  phone: string
  picks: Pick[]
  createdAt: string
  paymentProofUrl: string
}

// Simulación de resultados Sofascore (puedes quitar esto cuando uses tu API real)
const MOCK_RESULTS: Record<number, {
  eventId: number
  status: string
  homeScore: number
  awayScore: number
}> = {
  101: { eventId: 101, status: "finished", homeScore: 2, awayScore: 2 }, // empate (3 puntos si pick=draw)
  102: { eventId: 102, status: "finished", homeScore: 1, awayScore: 0 }, // home gana (2 puntos si pick=home)
  103: { eventId: 103, status: "finished", homeScore: 0, awayScore: 1 }, // away gana (2 puntos si pick=away)
}

export default function AdminPanel() {
    const [tickets, setTickets] = useState<Ticket[]>([])
    const [error, setError] = useState("")
    const [loading, setLoading] = useState(true)
    const [results, setResults] = useState<Record<number, { status: string, homeScore: number, awayScore: number }>>(MOCK_RESULTS)
    const [expanded, setExpanded] = useState<Record<string, boolean>>({}) // id: expanded

    useEffect(() => {
        async function fetchTickets() {
        setLoading(true)
        setError("")
        const token = localStorage.getItem("admin_token")
        if (!token) {
            window.location.href = "/admin/login"
            return
        }
        const res = await fetch("/api/admin/tickets", {
            headers: { "authorization": `Bearer ${token}` }
        })
        if (res.status === 401) {
            window.location.href = "/admin/login"
            return
        }
        const data = await res.json()
        if (!res.ok) {
            setError(data.error || "Error cargando tickets")
            setLoading(false)
            return
        }
        setTickets(data.tickets)
        setLoading(false)
        }
        fetchTickets()
    }, [])

    // Solo busca resultados una vez y para todos los partidos únicos de todos los tickets
    useEffect(() => {
        async function fetchAllResults() {
        // Recoge todos los eventIds únicos
        const allEventIds: number[] = Array.from(
            new Set(
            tickets.flatMap(ticket => ticket.picks.map(p => p.eventId))
            )
        )
        // Si tienes MOCK_RESULTS, puedes saltar el fetch
        if (Object.keys(MOCK_RESULTS).length > 0) {
            setResults(MOCK_RESULTS)
            return
        }
        // Si quieres usar la API real Sofascore, descomenta esto:
        /*
        const resultObj: Record<number, any> = {}
        for (const eventId of allEventIds) {
            const res = await fetch(`/api/sofascore/result?eventId=${eventId}`)
            if (res.ok) {
            const data = await res.json()
            resultObj[eventId] = data
            }
        }
        setResults(resultObj)
        */
        }
        if (tickets.length > 0) fetchAllResults()
    }, [tickets])

    const toggleExpand = (id: string) => {
        setExpanded(prev => ({ ...prev, [id]: !prev[id] }))
    }

    return (
        <main className="p-8 bg-gray-100 min-h-screen">
        <h1 className="text-2xl font-bold mb-4">Tickets (Quinielas)</h1>
        {loading && <p>Cargando...</p>}
        {error && <p className="text-red-600">{error}</p>}
        <ul className="space-y-6">
            {tickets.map(ticket => (
            <li key={ticket.id} className="bg-white rounded shadow p-4">
                <div className="flex justify-between">
                <div>
                    <div className="font-bold">Usuario: {ticket.username}</div>
                    <div>Email: {ticket.email}</div>
                    <div>Tel: {ticket.phone}</div>
                </div>
                <div className="text-right">
                    <a href={ticket.paymentProofUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">Comprobante</a>
                    <div className="text-xs text-gray-500">Fecha: {new Date(ticket.createdAt).toLocaleString()}</div>
                    <button
                    className="mt-2 px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                    onClick={() => toggleExpand(ticket.id)}
                    >
                    {expanded[ticket.id] ? "Ocultar" : "Ver resultados"}
                    </button>
                </div>
                </div>
                {expanded[ticket.id] && (
                <TicketPicks picks={ticket.picks} results={results} />
                )}
            </li>
            ))}
        </ul>
        </main>
    )
    }

    function TicketPicks({ picks, results }: { picks: Pick[], results: Record<number, { status: string, homeScore: number, awayScore: number }> }) {
    let totalPoints = 0
    return (
        <div className="mt-4 bg-gray-50 rounded p-3">
        <div className="font-semibold mb-2">Selecciones y Resultados:</div>
        <table className="w-full text-sm">
            <thead>
            <tr>
                <th>Partido</th>
                <th>Pick</th>
                <th>Resultado</th>
                <th>Puntos</th>
            </tr>
            </thead>
            <tbody>
            {picks.map(pick => {
                const res = results[pick.eventId]
                let puntos = 0
                if (res && res.status === "finished") {
                if (res.homeScore === res.awayScore && pick.pick === "draw") puntos = 3
                else if (
                    (res.homeScore > res.awayScore && pick.pick === "home") ||
                    (res.homeScore < res.awayScore && pick.pick === "away")
                ) puntos = 2
                }
                totalPoints += puntos
                return (
                <tr key={pick.eventId}>
                    <td>{pick.homeTeam} vs {pick.awayTeam}</td>
                    <td>{pick.pick}</td>
                    <td>
                    {res
                        ? res.status === "finished"
                        ? `${res.homeScore} - ${res.awayScore}`
                        : "Pendiente"
                        : "Cargando..."}
                    </td>
                    <td>{puntos > 0 ? `+${puntos}` : ""}</td>
                </tr>
                )
            })}
            </tbody>
        </table>
        <div className="mt-2 font-bold text-green-700">Total: {totalPoints} puntos</div>
        <div className="mt-1 text-xs text-gray-500">
            (Puedes probar con un partido empatado, ya tienes el evento 101 como empate)
        </div>
        </div>
    )
}