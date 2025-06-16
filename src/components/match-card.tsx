"use client"

import { Badge } from "@/components/ui/badge"
import Image from "next/image" 

type Team = { 
    id: number
    nameCode: string 
    name: string
}

type Event = {
    id: number
    homeTeam: Team
    awayTeam: Team
    tournament: { name: string }
    startTimestamp: number
}
interface MatchCardProps {
    match: Event
    pick: string | undefined
    onPickChange: (pick: string) => void
    isDisabled: boolean
}

function formatDate(ts: number) {
    const d = new Date(ts * 1000)
    return d.toLocaleString("es-VE", { timeZone: "America/Caracas" })
}

export function MatchCard({ match, pick, onPickChange, isDisabled }: MatchCardProps) {
    const formattedDate = formatDate(match.startTimestamp)
    const dateParts = formattedDate.split(", ")
    const date = dateParts[0]
    const time = dateParts[1]

return (
    <div
        className={`rounded-lg border border-[#223a6e] bg-[#0b174d]/80 shadow flex flex-col items-center px-2 py-2 min-h-[120px] text-xs
            ${isDisabled ? "opacity-50 pointer-events-none" : "hover:ring-2 hover:ring-[#ffcc00] transition"}
        `}
        >
        <div className="w-full flex justify-between items-center mb-1">
            <Badge className="text-[10px] bg-[#0b174d]/60 px-2 py-0.5 font-medium">{match.tournament?.name}</Badge>
            {isDisabled && (
            <span className="text-red-400 font-bold uppercase text-[10px]">Cerrado</span>
            )}
        </div>
        <div className="w-full flex items-center justify-between mb-1">
            {/* Home */}
            <div className="flex flex-col items-center w-16">
            <Image 
                src={`/teams/${match.homeTeam.nameCode}.png`}
                alt={match.homeTeam.name}
                className="w-6 h-6 rounded-full mb-0.5"
                width={24}
                height={24}
                loading="lazy"
            />
            <span className="text-white truncate font-medium">{match.homeTeam.nameCode}</span>
            </div>
            {/* VS and time */}
            <div className="flex flex-col items-center px-1">
            <span className="text-[11px] text-gray-300">{date}</span>
            <span className="text-[11px] text-[#ffcc00] font-bold">{time}</span>
            <span className="text-[10px] text-gray-500 font-bold">VS</span>
            </div>
            {/* Away */}
            <div className="flex flex-col items-center w-16">
            <Image 
                src={`/teams/${match.awayTeam.nameCode}.png`}
                alt={match.awayTeam.name}
                className="w-6 h-6 rounded-full mb-0.5"
                width={24}
                height={24}
                loading="lazy"
            />
            <span className="text-white truncate font-medium">{match.awayTeam.nameCode}</span>
            </div>
        </div>
        {/* Picks */}
        <div className="w-full flex justify-center gap-1 mt-1">
            <button
            type="button"
            disabled={isDisabled}
            className={`px-2 py-1 rounded text-[11px] font-semibold transition 
                ${pick === "home" ? "bg-[#ffcc00] text-[#00061f]" : "bg-white/10 text-white hover:bg-[#223a6e]"}
                ${isDisabled ? "opacity-60" : ""}
            `}
            onClick={() => !isDisabled && onPickChange("home")}
            >
            Local
            </button>
            <button
            type="button"
            disabled={isDisabled}
            className={`px-2 py-1 rounded text-[11px] font-semibold transition 
                ${pick === "draw" ? "bg-[#ffcc00] text-[#00061f]" : "bg-white/10 text-white hover:bg-[#223a6e]"}
                ${isDisabled ? "opacity-60" : ""}
            `}
            onClick={() => !isDisabled && onPickChange("draw")}
            >
            Empate
            </button>
            <button
            type="button"
            disabled={isDisabled}
            className={`px-2 py-1 rounded text-[11px] font-semibold transition 
                ${pick === "away" ? "bg-[#ffcc00] text-[#00061f]" : "bg-white/10 text-white hover:bg-[#223a6e]"}
                ${isDisabled ? "opacity-60" : ""}
            `}
            onClick={() => !isDisabled && onPickChange("away")}
            >
            Visitante
            </button>
        </div>
    </div>
    )
}
