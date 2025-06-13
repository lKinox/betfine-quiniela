"use client"

import { AlertTriangle } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"

interface DebugControlsProps {
    horaHoy: number
    setHoraHoy: (hora: number) => void
}

export function DebugControls({ horaHoy, setHoraHoy }: DebugControlsProps) {
    return (
        <Card className="mb-8 p-4 bg-[#0b174d]/50 border border-[#0b174d] backdrop-blur-sm">
        <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-[#ffcc00] flex-shrink-0 mt-1" />
            <div className="flex-1">
            <h3 className="text-[#ffcc00] font-semibold mb-2">Modo Debug</h3>
            <p className="text-gray-300 text-sm mb-4">Ajusta la hora del partido de hoy para probar diferentes estados</p>

            <div className="flex items-center gap-4">
                <div className="flex-1">
                <Slider
                    value={[horaHoy]}
                    min={0}
                    max={23}
                    step={1}
                    onValueChange={(value) => setHoraHoy(value[0])}
                    className="py-4"
                />
                </div>
                <div className="bg-black/20 rounded-md px-3 py-2 min-w-[60px] text-center">
                <span className="text-white font-mono">{horaHoy}:00</span>
                </div>
            </div>
            </div>
        </div>
        </Card>
    )
}