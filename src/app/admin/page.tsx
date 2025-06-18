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

type MatchResult = {
    winnerCode?: number // 1=home, 2=away, 3=draw
    status: string
    homeScore?: number
    awayScore?: number
    startTimestamp?: number
    homeTeamName?: string
    awayTeamName?: string
}

export default function AdminPanel() {
    const [tickets, setTickets] = useState<Ticket[]>([])
    const [error, setError] = useState("")
    const [loading, setLoading] = useState(true)
    const [results, setResults] = useState<Record<number, MatchResult>>({})
    const [expanded, setExpanded] = useState<Record<string, boolean>>({})

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

    useEffect(() => {
        async function fetchResultsFromRounds() {
            const res = await fetch("/api/rounds");
            if (!res.ok) return;
            const roundsData = await res.json();
            const resultMap: Record<number, MatchResult> = {};
            Object.values(roundsData).forEach((round: any) => {
                if (round && Array.isArray(round.events)) {
                    for (const event of round.events) {
                        resultMap[event.id] = {
                            winnerCode: event.winnerCode,
                            status: event.status?.type || "",
                            homeScore: event.homeScore?.current ?? 0,
                            awayScore: event.awayScore?.current ?? 0,
                            startTimestamp: event.startTimestamp,
                            homeTeamName: event.homeTeam?.name,
                            awayTeamName: event.awayTeam?.name,
                        };
                    }
                }
            });
            setResults(resultMap);
        }
        fetchResultsFromRounds();
    }, []);

    const toggleExpand = (id: string) => {
        setExpanded(prev => ({ ...prev, [id]: !prev[id] }))
    }

    // Calcular los puntos totales de un ticket
    function getTotalPoints(picks: Pick[], results: Record<number, MatchResult>) {
        let total = 0
        for (const pick of picks) {
            const res = results[pick.eventId]
            if (res && res.status === "finished" && typeof res.winnerCode === "number") {
                if (res.winnerCode === 1 && pick.pick === "home") total += 2
                else if (res.winnerCode === 2 && pick.pick === "away") total += 2
                else if (res.winnerCode === 3 && pick.pick === "draw") total += 3
            }
        }
        return total
    }

    // Ordenar los tickets por puntos totales
    const sortedTickets = [...tickets].sort((a, b) =>
        getTotalPoints(b.picks, results) - getTotalPoints(a.picks, results)
    )

    return (
        <main className="p-8 bg-gray-100 min-h-screen">
            <h1 className="text-2xl font-bold mb-4">Tickets (Quinielas)</h1>
            {loading && <p>Cargando...</p>}
            {error && <p className="text-red-600">{error}</p>}
            <ul className="space-y-6">
                {sortedTickets.map(ticket => {
                    const totalPoints = getTotalPoints(ticket.picks, results)
                    return (
                        <li key={ticket.id} className="bg-white rounded shadow p-4">
                            <div className="flex justify-between">
                                <div>
                                    <div className="font-bold">Usuario: {ticket.username}</div>
                                    <div>Email: {ticket.email}</div>
                                    <div>Tel: {ticket.phone}</div>
                                    <div className="font-bold text-green-700 mt-2">
                                        Total puntos: {totalPoints}
                                    </div>
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
                    )
                })}
            </ul>
        </main>
    )
}

function TicketPicks({
    picks,
    results
}: {
    picks: Pick[],
    results: Record<number, MatchResult>
}) {
    let totalPoints = 0

    function formatDateTime(ts?: number) {
        if (!ts) return "-"
        const date = new Date(ts * 1000)
        return date.toLocaleString("es-ES", {
            day: "2-digit", month: "2-digit", year: "2-digit",
            hour: "2-digit", minute: "2-digit"
        })
    }

    function winnerLabel(res?: MatchResult) {
        if (!res || typeof res.winnerCode !== "number") return ""
        if (res.winnerCode === 1) return res.homeTeamName || "Local"
        if (res.winnerCode === 2) return res.awayTeamName || "Visitante"
        if (res.winnerCode === 3) return "Empate"
        return ""
    }

    // Ordenar los picks por fecha del partido (startTimestamp)
    const sortedPicks = [...picks].sort((a, b) => {
        const tsA = results[a.eventId]?.startTimestamp || 0
        const tsB = results[b.eventId]?.startTimestamp || 0
        return tsA - tsB
    })

    return (
        <div className="mt-4 bg-gray-50 rounded p-3">
            <div className="font-semibold mb-2">Selecciones y Resultados:</div>
            <table className="w-full text-sm">
                <thead>
                    <tr>
                        <th>Partido</th>
                        <th>Fecha/Hora</th>
                        <th>Pick</th>
                        <th>Resultado</th>
                        <th>Puntos</th>
                        <th>Ganador</th>
                    </tr>
                </thead>
                <tbody>
                    {sortedPicks.map(pick => {
                        const res = results[pick.eventId]
                        let puntos = 0
                        let resultado = "-"

                        if (res && res.status === "finished") {
                            if (typeof res.winnerCode === "number") {
                                if (res.winnerCode === 1 && pick.pick === "home") {
                                    puntos = 2
                                } else if (res.winnerCode === 2 && pick.pick === "away") {
                                    puntos = 2
                                } else if (res.winnerCode === 3 && pick.pick === "draw") {
                                    puntos = 3
                                }
                            }
                            if (typeof res.homeScore === "number" && typeof res.awayScore === "number") {
                                resultado = `${res.homeScore} - ${res.awayScore}`
                            } else {
                                resultado = "Finalizado"
                            }
                        } else if (res) {
                            resultado = "Pendiente"
                        } else {
                            resultado = "Sin resultado"
                        }
                        totalPoints += puntos
                        return (
                            <tr key={pick.eventId}>
                                <td>
                                    {(res?.homeTeamName || pick.homeTeam) + " vs " + (res?.awayTeamName || pick.awayTeam)}
                                </td>
                                <td>
                                    {formatDateTime(res?.startTimestamp)}
                                </td>
                                <td>
                                    {pick.pick === "home"
                                        ? res?.homeTeamName || pick.homeTeam
                                        : pick.pick === "away"
                                            ? res?.awayTeamName || pick.awayTeam
                                            : "Empate"}
                                </td>
                                <td>{resultado}</td>
                                <td>{puntos > 0 ? `+${puntos}` : "0"}</td>
                                <td>{winnerLabel(res)}</td>
                            </tr>
                        )
                    })}
                </tbody>
            </table>
            <div className="mt-2 font-bold text-green-700">Total: {totalPoints} puntos</div>
        </div>
    )
}