import React, { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, Calendar as CalIcon, Clock, CheckCircle2 } from "lucide-react";
import api, { formatApiError } from "@/lib/api";
import Navbar from "@/components/Navbar";
import { Calendar } from "@/components/ui/calendar";
import { toast } from "sonner";

export default function BookingFlow() {
    const { serviceId } = useParams();
    const nav = useNavigate();
    const [service, setService] = useState(null);
    const [date, setDate] = useState(null);
    const [slots, setSlots] = useState([]);
    const [selectedTime, setSelectedTime] = useState(null);
    const [notes, setNotes] = useState("");
    const [loadingSlots, setLoadingSlots] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        api.get(`/services/${serviceId}`)
            .then(({ data }) => setService(data))
            .catch(() => toast.error("Serviço não encontrado"));
    }, [serviceId]);

    useEffect(() => {
        if (!date || !service) return;
        const d = date.toISOString().slice(0, 10);
        setSelectedTime(null);
        setLoadingSlots(true);
        api.get(`/providers/${service.provider_id}/slots`, {
            params: { service_id: service.id, date: d },
        })
            .then(({ data }) => setSlots(data.slots || []))
            .catch(() => setSlots([]))
            .finally(() => setLoadingSlots(false));
    }, [date, service]);

    const submit = async () => {
        if (!service || !date || !selectedTime) return;
        setSubmitting(true);
        try {
            const d = date.toISOString().slice(0, 10);
            const { data } = await api.post("/appointments", {
                service_id: service.id,
                date: d,
                start_time: selectedTime,
                notes,
            });
            toast.success("Agendamento criado! Confira seu e-mail.");
            nav(`/customer`, { state: { newAppointmentId: data.id } });
        } catch (err) {
            toast.error(formatApiError(err.response?.data?.detail) || err.message);
        } finally {
            setSubmitting(false);
        }
    };

    if (!service) {
        return (
            <div className="min-h-screen bg-[#F8FAFC]">
                <Navbar />
                <div className="max-w-5xl mx-auto px-6 py-16 text-center text-slate-500">
                    Carregando...
                </div>
            </div>
        );
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return (
        <div className="min-h-screen bg-[#F8FAFC]">
            <Navbar />
            <div className="max-w-5xl mx-auto px-6 lg:px-8 py-10">
                <Link
                    to={`/services/${serviceId}`}
                    className="text-sm font-semibold text-slate-500 hover:text-[#4338CA] inline-flex items-center gap-1 mb-6"
                >
                    <ArrowLeft size={14} />
                    Voltar
                </Link>

                <div className="mb-8">
                    <div className="label-uppercase mb-2">Reserva</div>
                    <h1 className="font-heading text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
                        Reservar {service.name}
                    </h1>
                    <p className="text-slate-600 mt-1">
                        com {service.provider_name} · {service.duration_minutes} min · R${" "}
                        {Number(service.price).toFixed(2)}
                    </p>
                </div>

                <div className="grid lg:grid-cols-3 gap-6">
                    {/* Calendar */}
                    <div className="card-default lg:col-span-1">
                        <h3 className="font-heading font-bold text-slate-900 mb-3 flex items-center gap-2">
                            <CalIcon size={16} className="text-[#4338CA]" />
                            Escolha a data
                        </h3>
                        <Calendar
                            mode="single"
                            selected={date}
                            onSelect={setDate}
                            disabled={(d) => d < today}
                            className="rounded-xl border border-slate-200"
                            data-testid="booking-calendar"
                        />
                    </div>

                    {/* Slots */}
                    <div className="card-default lg:col-span-2">
                        <h3 className="font-heading font-bold text-slate-900 mb-3 flex items-center gap-2">
                            <Clock size={16} className="text-[#4338CA]" />
                            Escolha o horário
                        </h3>

                        {!date ? (
                            <div className="py-10 text-center text-sm text-slate-500">
                                Selecione uma data primeiro
                            </div>
                        ) : loadingSlots ? (
                            <div className="py-10 text-center text-sm text-slate-500">
                                Carregando horários...
                            </div>
                        ) : slots.length === 0 ? (
                            <div
                                className="py-10 text-center text-sm text-slate-500"
                                data-testid="no-slots"
                            >
                                Sem horários disponíveis nesta data.
                            </div>
                        ) : (
                            <div
                                className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 stagger"
                                data-testid="slots-grid"
                            >
                                {slots.map((t) => (
                                    <button
                                        key={t}
                                        onClick={() => setSelectedTime(t)}
                                        className={`slot-tile px-3 py-2.5 rounded-xl text-sm font-bold border transition-all ${
                                            selectedTime === t
                                                ? "bg-[#4338CA] border-[#4338CA] text-white"
                                                : "bg-white border-slate-200 text-slate-700 hover:border-[#4338CA] hover:text-[#4338CA]"
                                        }`}
                                        data-testid={`slot-btn-${t}`}
                                    >
                                        {t}
                                    </button>
                                ))}
                            </div>
                        )}

                        {selectedTime && (
                            <div className="mt-6 space-y-4">
                                <div>
                                    <label className="label-uppercase block mb-2">
                                        Observações (opcional)
                                    </label>
                                    <textarea
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        placeholder="Alguma preferência ou informação importante..."
                                        rows={3}
                                        className="input-base resize-none"
                                        data-testid="booking-notes-input"
                                    />
                                </div>

                                <div className="p-4 rounded-xl bg-[#4338CA]/5 border border-[#4338CA]/10">
                                    <div className="text-sm text-slate-600 mb-1">
                                        Resumo da reserva
                                    </div>
                                    <div className="font-bold text-slate-900">
                                        {service.name} · {date.toLocaleDateString("pt-BR")} ·{" "}
                                        {selectedTime}
                                    </div>
                                    <div className="text-sm text-[#4338CA] font-bold mt-1">
                                        R$ {Number(service.price).toFixed(2)}
                                    </div>
                                </div>

                                <button
                                    onClick={submit}
                                    disabled={submitting}
                                    className="btn-primary w-full inline-flex items-center justify-center gap-2"
                                    data-testid="confirm-booking-btn"
                                >
                                    {submitting ? "Reservando..." : "Confirmar reserva"}
                                    {!submitting && <CheckCircle2 size={16} />}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
