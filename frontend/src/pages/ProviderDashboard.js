import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
    Calendar as CalIcon,
    Briefcase,
    Clock,
    Star,
    DollarSign,
    ArrowRight,
    CheckCircle2,
    Users,
} from "lucide-react";
import api from "@/lib/api";
import Navbar from "@/components/Navbar";
import AppointmentCard from "@/components/AppointmentCard";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const BANNER_IMAGE =
    "https://static.prod-images.emergentagent.com/jobs/8fcc6aa0-d3c0-4ee2-9d28-8273e4f4c56c/images/28e182a2e92c0b24cb4bf98e72df3dbd15a783c2d6ac600f873ee0c4f97f4e69.png";

export default function ProviderDashboard() {
    const { user } = useAuth();
    const [stats, setStats] = useState(null);
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);

    const load = async () => {
        setLoading(true);
        try {
            const [s, a] = await Promise.all([
                api.get("/stats/provider"),
                api.get("/appointments/provider"),
            ]);
            setStats(s.data);
            setAppointments(a.data);
        } catch {
            toast.error("Erro ao carregar painel");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, []);

    const onConfirm = async (a) => {
        try {
            await api.put(`/appointments/${a.id}/confirm`);
            toast.success("Agendamento confirmado! Cliente notificado por e-mail.");
            load();
        } catch (err) {
            toast.error(err.response?.data?.detail || "Erro");
        }
    };
    const onComplete = async (a) => {
        try {
            await api.put(`/appointments/${a.id}/complete`);
            toast.success("Marcado como concluído");
            load();
        } catch (err) {
            toast.error(err.response?.data?.detail || "Erro");
        }
    };
    const onCancel = async (a) => {
        if (!window.confirm("Cancelar este agendamento?")) return;
        try {
            await api.put(`/appointments/${a.id}/cancel`);
            toast.success("Cancelado");
            load();
        } catch (err) {
            toast.error(err.response?.data?.detail || "Erro");
        }
    };

    const today = new Date().toISOString().slice(0, 10);
    const todayAppts = appointments.filter(
        (a) => a.date === today && (a.status === "pending" || a.status === "confirmed")
    );
    const upcomingAppts = appointments.filter(
        (a) => a.date > today && (a.status === "pending" || a.status === "confirmed")
    );
    const pendingAppts = appointments.filter((a) => a.status === "pending");

    return (
        <div className="min-h-screen bg-[#F8FAFC]">
            <Navbar />

            {/* Hero banner */}
            <div className="relative h-52 overflow-hidden">
                <img
                    src={BANNER_IMAGE}
                    alt="Banner"
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-[#4338CA]/80 to-[#FF5A5F]/60" />
                <div className="absolute inset-0 flex items-center">
                    <div className="max-w-7xl mx-auto px-6 lg:px-8 w-full">
                        <div className="label-uppercase text-white/80 mb-2">
                            Painel do Prestador
                        </div>
                        <h1 className="font-heading text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
                            Bom dia, {user?.name?.split(" ")[0]}!
                        </h1>
                        <p className="text-white/80 mt-1">
                            {stats?.today_appointments || 0} agendamento(s) hoje.
                        </p>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 lg:px-8 py-10">
                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <StatCard
                        label="Hoje"
                        value={stats?.today_appointments ?? 0}
                        icon={CalIcon}
                        color="text-[#4338CA]"
                        bg="bg-[#4338CA]/8"
                    />
                    <StatCard
                        label="Pendentes"
                        value={stats?.pending_appointments ?? 0}
                        icon={Clock}
                        color="text-amber-600"
                        bg="bg-amber-50"
                    />
                    <StatCard
                        label="Concluídos"
                        value={stats?.completed_appointments ?? 0}
                        icon={CheckCircle2}
                        color="text-emerald-600"
                        bg="bg-emerald-50"
                    />
                    <StatCard
                        label="Receita"
                        value={`R$ ${Number(stats?.revenue || 0).toFixed(0)}`}
                        icon={DollarSign}
                        color="text-[#FF5A5F]"
                        bg="bg-[#FF5A5F]/8"
                    />
                </div>

                {/* Quick links */}
                <div className="grid md:grid-cols-3 gap-4 mb-10">
                    <Link
                        to="/provider/services"
                        className="card-interactive flex items-center justify-between"
                        data-testid="link-services"
                    >
                        <div>
                            <div className="w-11 h-11 rounded-xl bg-[#4338CA]/10 flex items-center justify-center mb-2">
                                <Briefcase className="w-5 h-5 text-[#4338CA]" />
                            </div>
                            <div className="font-heading font-bold text-slate-900">
                                Meus Serviços
                            </div>
                            <div className="text-xs text-slate-500">
                                {stats?.services_count ?? 0} cadastrado(s)
                            </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-400" />
                    </Link>
                    <Link
                        to="/provider/availability"
                        className="card-interactive flex items-center justify-between"
                        data-testid="link-availability"
                    >
                        <div>
                            <div className="w-11 h-11 rounded-xl bg-[#FF5A5F]/10 flex items-center justify-center mb-2">
                                <Clock className="w-5 h-5 text-[#FF5A5F]" />
                            </div>
                            <div className="font-heading font-bold text-slate-900">
                                Horários
                            </div>
                            <div className="text-xs text-slate-500">
                                Configurar disponibilidade
                            </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-400" />
                    </Link>
                    <Link
                        to="/provider/appointments"
                        className="card-interactive flex items-center justify-between"
                        data-testid="link-appointments"
                    >
                        <div>
                            <div className="w-11 h-11 rounded-xl bg-emerald-100 flex items-center justify-center mb-2">
                                <Users className="w-5 h-5 text-emerald-600" />
                            </div>
                            <div className="font-heading font-bold text-slate-900">
                                Agendamentos
                            </div>
                            <div className="text-xs text-slate-500">
                                Ver todos ({appointments.length})
                            </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-400" />
                    </Link>
                </div>

                {/* Rating card */}
                {stats && stats.review_count > 0 && (
                    <div className="card-default mb-8 flex items-center gap-6 flex-wrap">
                        <div className="flex items-center gap-3">
                            <Star className="w-8 h-8 text-[#FF5A5F] fill-[#FF5A5F]" />
                            <div>
                                <div className="font-heading text-3xl font-extrabold text-slate-900">
                                    {stats.avg_rating.toFixed(1)}
                                </div>
                                <div className="text-xs text-slate-500 font-bold uppercase tracking-wider">
                                    Nota média · {stats.review_count} avaliação(ões)
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Today's appointments */}
                <section className="mb-10">
                    <h2 className="font-heading text-2xl font-bold text-slate-900 mb-4">
                        Agenda de Hoje
                    </h2>
                    {loading ? (
                        <div className="text-slate-500">Carregando...</div>
                    ) : todayAppts.length === 0 ? (
                        <div className="card-default text-center py-12" data-testid="no-today">
                            <CalIcon className="w-10 h-10 mx-auto text-slate-300 mb-3" />
                            <h3 className="font-bold text-slate-900 mb-1">
                                Nenhum agendamento hoje
                            </h3>
                            <p className="text-sm text-slate-500">
                                Aproveite o dia livre!
                            </p>
                        </div>
                    ) : (
                        <div className="grid md:grid-cols-2 gap-4 stagger">
                            {todayAppts.map((a) => (
                                <AppointmentCard
                                    key={a.id}
                                    appointment={a}
                                    role="provider"
                                    onConfirm={onConfirm}
                                    onComplete={onComplete}
                                    onCancel={onCancel}
                                />
                            ))}
                        </div>
                    )}
                </section>

                {/* Pending */}
                {pendingAppts.length > 0 && (
                    <section className="mb-10">
                        <h2 className="font-heading text-2xl font-bold text-slate-900 mb-4">
                            Aguardando Confirmação
                        </h2>
                        <div className="grid md:grid-cols-2 gap-4">
                            {pendingAppts.map((a) => (
                                <AppointmentCard
                                    key={a.id}
                                    appointment={a}
                                    role="provider"
                                    onConfirm={onConfirm}
                                    onComplete={onComplete}
                                    onCancel={onCancel}
                                />
                            ))}
                        </div>
                    </section>
                )}
            </div>
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
