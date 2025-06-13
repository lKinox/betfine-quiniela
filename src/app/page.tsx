"use client"
import { useEffect, useState, ChangeEvent } from "react"
import { motion } from "framer-motion"
import { Trophy, AlertCircle, CheckCircle2, Timer, Image as ImageIcon } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Toaster } from "@/components/ui/sonner"
import { toast } from "sonner"
import { MatchCard } from "@/components/match-card"
import { DebugControls } from "@/components/debug-controls"

type Team = {
  id: number
  name: string
  nameCode: string
}

type Event = {
  id: number
  homeTeam: Team
  awayTeam: Team
  tournament: { name: string }
  startTimestamp: number
}

type Rounds = {
  [round: string]: Event[]
}

const ROUND_URLS = [
  {
    round: "Ronda 1",
    url: "https://www.sofascore.com/api/v1/unique-tournament/357/season/69619/events/round/1"
  },
  {
    round: "Ronda 2",
    url: "https://www.sofascore.com/api/v1/unique-tournament/357/season/69619/events/round/2"
  },
  {
    round: "Ronda 3",
    url: "https://www.sofascore.com/api/v1/unique-tournament/357/season/69619/events/round/3"
  }
]

function getNowVenezuelaTimestamp() {
  const now = new Date()
  // UTC-4
  const venezuelaTime = new Date(now.getTime() - 4 * 60 * 60 * 1000)
  return Math.floor(venezuelaTime.getTime() / 1000)
}

// Cloudinary config
const CLOUDINARY_CLOUD_NAME = "dzwnkz2fj".toLowerCase(); // The apikey is not the cloudName! You must use your Cloudinary cloud name.
const CLOUDINARY_UPLOAD_PRESET = "quinielas"; // You must create this unsigned preset in your Cloudinary dashboard.
const CLOUDINARY_FOLDER = "images"; // Your asset folder

// Helper to upload to Cloudinary
async function uploadImageToCloudinary(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
  formData.append("folder", CLOUDINARY_FOLDER);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) throw new Error("Error al subir imagen");
  const data = await res.json();
  return data.secure_url; // Public URL
}

export default function Home() {
  const [rounds, setRounds] = useState<Rounds>({})
  const [loading, setLoading] = useState(true)
  const [picks, setPicks] = useState<Record<number, string>>({})
  const [now, setNow] = useState(getNowVenezuelaTimestamp())
  const [horaHoy, setHoraHoy] = useState(20)

  // Campos del usuario
  const [userName, setUserName] = useState("")
  const [userPhone, setUserPhone] = useState("")
  const [userEmail, setUserEmail] = useState("")
  const [paymentProof, setPaymentProof] = useState<File | null>(null)
  const [paymentPreview, setPaymentPreview] = useState<string | null>(null)

  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(getNowVenezuelaTimestamp())
    }, 30 * 1000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    async function fetchAllRounds() {
      setLoading(true)
      try {
        const results = await Promise.all(
          ROUND_URLS.map(async ({ round, url }) => {
            const res = await fetch(url)
            const data = await res.json()
            return { round, events: data.events || [] }
          })
        )
        const newRounds: Rounds = {}
        results.forEach(({ round, events }) => {
          newRounds[round] = events
        })
        setRounds(newRounds)
      } catch (err) {
        setRounds({})
      }
      setLoading(false)
    }
    fetchAllRounds()
  }, [horaHoy])

  const handleChange = (matchId: number, pick: string) => {
    setPicks((prev) => ({
      ...prev,
      [matchId]: pick,
    }))
  }

  const handleProofChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setPaymentProof(e.target.files[0])
      setPaymentPreview(URL.createObjectURL(e.target.files[0]))
    } else {
      setPaymentProof(null)
      setPaymentPreview(null)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (submitting) return; // evita doble envío
    setSubmitting(true);
    
    // Validación de campos de usuario
    if (!userName.trim() || !userPhone.trim() || !userEmail.trim()) {
      toast("Completa todos los campos del usuario", {
        description: "Nombre, teléfono y email son obligatorios",
        style: { backgroundColor: 'red', color: 'white' },
      })
      setSubmitting(false);
      return
    }
    if (!paymentProof) {
      toast("Adjunta el comprobante de pago", {
        description: "Debes subir una imagen del comprobante.",
        style: { backgroundColor: 'red', color: 'white' },
      })
      setSubmitting(false);
      return
    }
    // Validar sólo partidos NO iniciados de TODAS las rondas
    const allEvents: Event[] = Object.values(rounds).flat()
    const partidosNoIniciados = allEvents.filter((event) => now < event.startTimestamp)
    if (partidosNoIniciados.some((p) => !picks[p.id])) {
      toast("Error: Selección Incompleta", {
        description: "Debes hacer una selección en todos los partidos que no han iniciado.",
        style: { backgroundColor: 'red', color: 'white' },
      });
      return;
    }

    try {
      // 1. Subir la imagen a Cloudinary y obtener la URL pública
      const paymentProofUrl = await uploadImageToCloudinary(paymentProof);

      // 2. Prepara los picks como array
      const picksArray = Object.entries(picks).map(([eventId, pick]) => {
        const event = allEvents.find(ev => ev.id === Number(eventId))
        return {
          eventId: Number(eventId),
          homeTeam: event?.homeTeam.nameCode,
          awayTeam: event?.awayTeam.nameCode,
          pick,
        }
      })

      // 3. Envía los datos a la API (guarda en la base de datos)
      const res = await fetch("/api/selections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: userName,
          email: userEmail,
          phone: userPhone,
          picks: picksArray,
          paymentProofUrl,
        }),
      })
      if (!res.ok) throw new Error("Error guardando selección")

      toast("¡Quiniela enviada!", {
        description: "Tus predicciones y comprobante han sido registrados correctamente.",
        style: { backgroundColor: 'green', color: 'white' },
      })

      setTimeout(() => {
        window.location.reload()
      }, 2000)

      // Limpia el formulario si quieres
      setUserName("")
      setUserEmail("")
      setUserPhone("")
      setPicks({})
      setPaymentProof(null)
      setPaymentPreview(null)
    } catch (err) {
      toast("Error en el envío", {
        description: "Hubo un problema al enviar la quiniela.",
        style: { backgroundColor: 'red', color: 'white' },
      })
    }
  }

  return (
    <main className="min-h-screen bg-[#00061f] py-12 px-4">
      <div className="max-w-6xl mx-auto">

        
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-extrabold text-[#ffcc00] mb-4 tracking-tight">Quiniela Deportiva Betfine24</h1>
          <p className="text-gray-300 max-w-2xl mx-auto text-lg">
            Predice los resultados de los partidos y compite con tus amigos
          </p>
        </motion.div>

        {/* Datos de usuario
        <DebugControls horaHoy={horaHoy} setHoraHoy={setHoraHoy} />
        */}

        {loading && (
          <div className="flex justify-center py-12">
            <div className="flex flex-col items-center gap-4">
              <div className="h-12 w-12 rounded-full border-4 border-t-[#ffcc00] border-[#0b174d] animate-spin"></div>
              <p className="text-white font-medium">Cargando partidos...</p>
            </div>
          </div>
        )}

        {!loading && Object.values(rounds).flat().length === 0 && (
          <Card className="p-8 text-center bg-[#0b174d]/80 backdrop-blur-sm border-[#0b174d]">
            <AlertCircle className="h-12 w-12 text-[#ffcc00] mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">No hay partidos disponibles</h3>
            <p className="text-gray-300">Vuelve más tarde para ver los próximos encuentros</p>
          </Card>
        )}

        {!loading && Object.values(rounds).flat().length > 0 && (
          <form onSubmit={handleSubmit} className="space-y-10">
            {/* Datos de usuario */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="bg-[#0b174d]/80 rounded-xl shadow-xl border border-[#172c53] p-8 mb-8 flex flex-col md:flex-row gap-8"
            >
              <div className="flex-1 flex flex-col gap-4">
                <label className="text-white font-semibold flex flex-col gap-1">
                  Nombre de usuario *
                  <input
                    type="text"
                    className="bg-[#101e3a] text-white border border-[#223a6e] rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#ffcc00] placeholder:text-gray-400"
                    placeholder="Tu nombre o alias"
                    value={userName}
                    onChange={e => setUserName(e.target.value)}
                    required
                  />
                </label>
                <label className="text-white font-semibold flex flex-col gap-1">
                  Teléfono *
                  <input
                    type="tel"
                    className="bg-[#101e3a] text-white border border-[#223a6e] rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#ffcc00] placeholder:text-gray-400"
                    placeholder="Número de WhatsApp"
                    value={userPhone}
                    onChange={e => setUserPhone(e.target.value)}
                    required
                  />
                </label>
                <label className="text-white font-semibold flex flex-col gap-1">
                  Email *
                  <input
                    type="email"
                    className="bg-[#101e3a] text-white border border-[#223a6e] rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#ffcc00] placeholder:text-gray-400"
                    placeholder="tucorreo@email.com"
                    value={userEmail}
                    onChange={e => setUserEmail(e.target.value)}
                    required
                  />
                </label>
              </div>
              <div className="flex-1 flex flex-col gap-2 items-center justify-center">
                <label className="text-white font-semibold flex flex-col gap-2 items-center">
                  Comprobante de pago *
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    id="payment-proof-input"
                    onChange={handleProofChange}
                  />
                  <Button
                    className="bg-[#ffcc00] hover:bg-[#ffcc00]/80 text-[#00061f] font-bold px-4 py-2 rounded-lg mt-2"
                    type="button"
                    onClick={() => document.getElementById('payment-proof-input')?.click()}
                  >
                    <ImageIcon className="mr-2 h-5 w-5" />
                    {paymentProof ? "Cambiar comprobante" : "Subir comprobante"}
                  </Button>
                  {paymentPreview && (
                    <div className="mt-4 flex flex-col items-center gap-2">
                      <span className="text-xs text-gray-300">Vista previa:</span>
                      <img
                        src={paymentPreview}
                        alt="Comprobante de pago"
                        className="rounded-lg border border-[#223a6e] shadow w-36 h-36 object-cover"
                      />
                    </div>
                  )}
                </label>
              </div>
            </motion.div>

            {/* Secciones de rondas */}
            {ROUND_URLS.map(({ round }) => {
              const events = rounds[round] || []
              if (events.length === 0) return null
              const upcomingMatches = events.filter((event) => now < event.startTimestamp)
              const pastMatches = events.filter((event) => now >= event.startTimestamp)
              return (
                <section key={round} className="mb-16">
                  {upcomingMatches.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.2 }}
                    >
                      <div className="flex items-center gap-3 mb-6">
                        <Timer className="h-6 w-6 text-[#ffcc00]" />
                        <h2 className="text-2xl font-bold text-white">{round}: Partidos Próximos</h2>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                        {upcomingMatches.map((match) => (
                          <MatchCard
                            key={match.id}
                            match={match}
                            pick={picks[match.id]}
                            onPickChange={(pick) => handleChange(match.id, pick)}
                            isDisabled={false}
                          />
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {pastMatches.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.4 }}
                      className="mt-8"
                    >
                      <div className="flex items-center gap-3 mb-6">
                        <CheckCircle2 className="h-6 w-6 text-gray-400" />
                        <h2 className="text-2xl font-bold text-gray-300">{round}: Partidos Cerrados</h2>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 opacity-70">
                        {pastMatches.map((match) => (
                          <MatchCard
                            key={match.id}
                            match={match}
                            pick={picks[match.id]}
                            onPickChange={() => {}}
                            isDisabled={true}
                          />
                        ))}
                      </div>
                    </motion.div>
                  )}
                </section>
              )
            })}

            {/* Submit Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              className="flex justify-center mt-12"
            >
              <Button
                type="submit"
                size="lg"
                disabled={submitting}
                className="bg-[#ffcc00] hover:bg-[#ffcc00]/80 text-[#00061f] font-bold text-lg px-12 py-6 h-auto rounded-xl shadow-lg shadow-black/20 transition-all duration-300 hover:scale-105 flex items-center justify-center"
              >
                {submitting ? (
                  <>
                    <span className="loader mr-2"></span> {/* Loader CSS */}
                    Enviando...
                  </>
                ) : (
                  <>
                    <Trophy className="mr-2 h-5 w-5" />
                    Enviar Quiniela
                  </>
                )}
              </Button>
            </motion.div>
          </form>
        )}
      </div>
      <Toaster />
    </main>
  )
}