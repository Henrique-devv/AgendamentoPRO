import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Calendar as CalIcon, ArrowRight, Sparkles, CheckCircle2 } from "lucide-react";
import api, { formatApiError } from "@/lib/api";
import Navbar from "@/components/Navbar";
import AppointmentCard from "@/components/AppointmentCard";
import { Calendar } from "@/components/ui/calendar";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export default function CustomerDashboard() {
    const { user } = useAuth();
    const [appointments, setAppointments] = useState([]);
    const [reviews, setReviews] = useState({});
    const [loading, setLoading] = useState(true);

    // Reschedule modal state
    const [rescheduleAppt, setRescheduleAppt] = useState(null);
    const [rescheduleDate, setRescheduleDate] = useState(null);
    const [rescheduleSlots, setRescheduleSlots] = useState([]);
    const [rescheduleTime, setRescheduleTime] = useState(null);
    const [loadingSlots, setLoadingSlots] = useState(false);

    // Review modal state
    const [reviewAppt, setReviewAppt] = useState(null);
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState("");

    const load = async () => {
        setLoading(true);
        try {
            const { data } = await api.get("/appointments/customer");
            setAppointments(data);
            // Fetch reviews to check which appointments have been reviewed
            const reviewMap = {};
            await Promise.all(
                data
                    .filter((a) => a.status === "completed")
                    .map(async (a) => {
                        try {
                            const r = await api.get(`/services/${a.service_id}/reviews`);
                            const mine = r.data.find((rev) => rev.appointment_id === a.id);
                            if (mine) reviewMap[a.id] = mine;
                        } catch { /* ignore */ }
                    })
            );
            setReviews(reviewMap);
        } catch {
            toast.error("Erro ao carregar agendamentos");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, []);

    useEffect(() => {
        if (!rescheduleAppt || !rescheduleDate) return;
        setLoadingSlots(true);
        const d = rescheduleDate.toISOString().slice(0, 10);
        api.get(`/providers/${rescheduleAppt.provider_id}/slots`, {
            params: { service_id: rescheduleAppt.service_id, date: d },
        })
            .then(({ data }) => setRescheduleSlots(data.slots || []))
            .finally(() => setLoadingSlots(false));
    }, [rescheduleAppt, rescheduleDate]);

    const onCancel = async (a) => {
        if (!window.confirm("Cancelar este agendamento?")) return;
        try {
            await api.put(`/appointments/${a.id}/cancel`);
            toast.success("Agendamento cancelado");
            load();
        } catch (err) {
            toast.error(formatApiError(err.response?.data?.detail));
        }
    };

    const onReschedule = (a) => {
        setRescheduleAppt(a);
        setRescheduleDate(null);
        setRescheduleSlots([]);
        setRescheduleTime(null);
    };

    const confirmReschedule = async () => {
        if (!rescheduleAppt || !rescheduleDate || !rescheduleTime) return;
        try {
            await api.put(`/appointments/${rescheduleAppt.id}/reschedule`, {
                date: rescheduleDate.toISOString().slice(0, 10),
                start_time: rescheduleTime,
            });
            toast.success("Reagendado com sucesso!");
            setRescheduleAppt(null);
            load();
        } catch (err) {
            toast.error(formatApiError(err.response?.data?.detail));
        }
    };

    const onReview = (a) => {
        setReviewAppt(a);
        setRating(5);
        setComment("");
    };

    const submitReview = async () => {
        if (!reviewAppt) return;
        try {
            await api.post("/reviews", {
                appointment_id: reviewAppt.id,
                rating,
                comment,
            });
            toast.success("Avaliação enviada!");
            setReviewAppt(null);
            load();
        } catch (err) {
            toast.error(formatApiError(err.response?.data?.detail));
        }
    };

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const upcoming = appointments.filter(
        (a) => a.status === "pending" || a.status === "confirmed"
    );
    const past = appointments.filter(
        (a) => a.status === "completed" || a.status === "cancelled"
    );

    return (
        <div className="min-h-screen bg-[#F8FAFC]">
            <Navbar />
            <div className="max-w-7xl mx-auto px-6 lg:px-8 py-10">
                <div className="mb-8 flex items-center justify-between gap-4 flex-wrap">
                    <div>
                        <div className="label-uppercase mb-2">Painel do Cliente</div>
                        <h1 className="font-heading text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
                            Olá, {user?.name?.split(" ")[0]}!
                        </h1>
                        <p className="text-slate-600 mt-1">
                            Gerencie seus agendamentos em um só lugar.
                        </p>
                    </div>
                    <Link
                        to="/services"
                        className="btn-primary inline-flex items-center gap-2"
                        data-testid="explore-services-btn"
                    >
                        <Sparkles size={16} />
                        Explorar serviços
                    </Link>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 mb-8">
                    <StatCard
                        label="Próximos"
                        value={upcoming.length}
                        icon={CalIcon}
                        color="text-[#4338CA]"
                        bg="bg-[#4338CA]/8"
                    />
                    <StatCard
                        label="Concluídos"
                        value={appointments.filter((a) => a.status === "completed").length}
                        icon={CheckCircle2}
                        color="text-emerald-600"
                        bg="bg-emerald-50"
                    />
                    <StatCard
                        label="Cancelados"
                        value={appointments.filter((a) => a.status === "cancelled").length}
                        icon={ArrowRight}
                        color="text-slate-600"
                        bg="bg-slate-100"
                    />
                </div>

                {/* Upcoming */}
                <section className="mb-10">
                    <h2 className="font-heading text-2xl font-bold text-slate-900 mb-4">
                        Próximos agendamentos
                    </h2>
                    {loading ? (
                        <div className="text-slate-500">Carregando...</div>
                    ) : upcoming.length === 0 ? (
                        <div className="card-default text-center py-12" data-testid="no-upcoming">
                            <CalIcon className="w-10 h-10 mx-auto text-slate-300 mb-3" />
                            <h3 className="font-bold text-slate-900 mb-1">
                                Sem agendamentos próximos
                            </h3>
                            <p className="text-sm text-slate-500 mb-4">
                                Que tal reservar um serviço?
                            </p>
                            <Link to="/services" className="btn-primary inline-block text-sm">
                                Ver catálogo
                            </Link>
                        </div>
                    ) : (
                        <div className="grid md:grid-cols-2 gap-4 stagger">
                            {upcoming.map((a) => (
                                <AppointmentCard
                                    key={a.id}
                                    appointment={a}
                                    role="customer"
                                    onCancel={onCancel}
                                    onReschedule={onReschedule}
                                />
                            ))}
                        </div>
                    )}
                </section>

                {/* Past */}
                <section>
                    <h2 className="font-heading text-2xl font-bold text-slate-900 mb-4">
                        Histórico
                    </h2>
                    {past.length === 0 ? (
                        <div className="text-sm text-slate-500">Sem registros.</div>
                    ) : (
                        <div className="grid md:grid-cols-2 gap-4">
                            {past.map((a) => (
                                <AppointmentCard
                                    key={a.id}
                                    appointment={a}
                                    role="customer"
                                    onReview={onReview}
                                    hasReview={!!reviews[a.id]}
                                />
                            ))}
                        </div>
                    )}
                </section>
            </div>

            {/* Reschedule Modal */}
            <Dialog open={!!rescheduleAppt} onOpenChange={(o) => !o && setRescheduleAppt(null)}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle className="font-heading text-xl">
                            Reagendar
                        </DialogTitle>
                        <DialogDescription>
                            Escolha uma nova data e horário para {rescheduleAppt?.service_name}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid md:grid-cols-2 gap-4">
                        <Calendar
                            mode="single"
                            selected={rescheduleDate}
                            onSelect={setRescheduleDate}
                            disabled={(d) => d < today}
                            className="rounded-xl border border-slate-200"
                        />
                        <div>
                            <div className="label-uppercase mb-2">Horários</div>
                            {!rescheduleDate ? (
                                <div className="text-sm text-slate-500">
                                    Selecione uma data
                                </div>
                            ) : loadingSlots ? (
                                <div className="text-sm text-slate-500">
                                    Carregando...
                                </div>
                            ) : rescheduleSlots.length === 0 ? (
                                <div className="text-sm text-slate-500">
                                    Sem horários disponíveis
                                </div>
                            ) : (
                                <div className="grid grid-cols-3 gap-2">
                                    {rescheduleSlots.map((t) => (
                                        <button
                                            key={t}
                                            onClick={() => setRescheduleTime(t)}
                                            className={`slot-tile px-2 py-2 rounded-lg text-xs font-bold border transition-all ${
                                                rescheduleTime === t
                                                    ? "bg-[#4338CA] border-[#4338CA] text-white"
                                                    : "bg-white border-slate-200 text-slate-700 hover:border-[#4338CA]"
                                            }`}
                                            data-testid={`reschedule-slot-${t}`}
                                        >
                                            {t}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="flex justify-end gap-2 mt-4">
                        <Button
                            variant="outline"
                            onClick={() => setRescheduleAppt(null)}
                            className="rounded-xl"
                        >
                            Cancelar
                        </Button>
                        <Button
                            onClick={confirmReschedule}
                            disabled={!rescheduleDate || !rescheduleTime}
                            className="btn-primary rounded-xl"
                            data-testid="confirm-reschedule-btn"
                        >
                            Confirmar reagendamento
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Review Modal */}
            <Dialog open={!!reviewAppt} onOpenChange={(o) => !o && setReviewAppt(null)}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="font-heading text-xl">
                            Avaliar serviço
                        </DialogTitle>
                        <DialogDescription>
                            {reviewAppt?.service_name} com {reviewAppt?.provider_name}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div>
                            <div className="label-uppercase mb-2">Nota</div>
                            <div className="flex gap-2">
                                {[1, 2, 3, 4, 5].map((n) => (
                                    <button
                                        key={n}
                                        onClick={() => setRating(n)}
                                        className={`flex-1 py-3 rounded-xl border-2 text-xl font-bold transition-all ${
                                            n <= rating
                                                ? "border-[#FF5A5F] bg-[#FF5A5F] text-white"
                                                : "border-slate-200 text-slate-400"
                                        }`}
                                        data-testid={`rating-btn-${n}`}
                                    >
                                        ★
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <label className="label-uppercase block mb-2">Comentário</label>
                            <textarea
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                placeholder="Compartilhe sua experiência..."
                                rows={4}
                                className="input-base resize-none"
                                data-testid="review-comment-input"
                            />
                        </div>
                    </div>
                    <div className="flex justify-end gap-2">
                        <Button
                            variant="outline"
                            onClick={() => setReviewAppt(null)}
                            className="rounded-xl"
                        >
                            Cancelar
                        </Button>
                        <Button
                            onClick={submitReview}
                            className="btn-coral rounded-xl"
                            data-testid="submit-review-btn"
                        >
                            Enviar avaliação
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}

function StatCard({ label, value, icon: Icon, color, bg }) {
    return (
        <div className="card-default">
            <div className="flex items-center gap-3">
                <div className={`w-11 h-11 rounded-xl ${bg} flex items-center justify-center`}>
                    <Icon className={`w-5 h-5 ${color}`} />
                </div>
                <div>
                    <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                        {label}
                    </div>
                    <div className="font-heading text-2xl font-extrabold text-slate-900">
                        {value}
                    </div>
                </div>
            </div>
        </div>
    );
}
