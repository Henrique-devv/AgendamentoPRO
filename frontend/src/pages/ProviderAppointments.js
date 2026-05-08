import React, { useEffect, useState } from "react";
import { Filter } from "lucide-react";
import api from "@/lib/api";
import Navbar from "@/components/Navbar";
import AppointmentCard from "@/components/AppointmentCard";
import { toast } from "sonner";

const FILTERS = [
    { key: "all", label: "Todos" },
    { key: "pending", label: "Pendentes" },
    { key: "confirmed", label: "Confirmados" },
    { key: "completed", label: "Concluídos" },
    { key: "cancelled", label: "Cancelados" },
];

export default function ProviderAppointments() {
    const [appointments, setAppointments] = useState([]);
    const [filter, setFilter] = useState("all");
    const [loading, setLoading] = useState(true);

    const load = async () => {
        setLoading(true);
        try {
            const { data } = await api.get("/appointments/provider");
            setAppointments(data);
        } catch {
            toast.error("Erro ao carregar");
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
            toast.success("Confirmado! Cliente notificado.");
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

    const list =
        filter === "all"
            ? appointments
            : appointments.filter((a) => a.status === filter);

    return (
        <div className="min-h-screen bg-[#F8FAFC]">
            <Navbar />
            <div className="max-w-7xl mx-auto px-6 lg:px-8 py-10">
                <div className="mb-8">
                    <div className="label-uppercase mb-2">Prestador</div>
                    <h1 className="font-heading text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
                        Todos os Agendamentos
                    </h1>
                    <p className="text-slate-600 mt-1">
                        Gerencie pedidos, confirmações e atendimentos.
                    </p>
                </div>

                <div className="card-default mb-6 flex items-center gap-2 flex-wrap">
                    <Filter size={14} className="text-slate-400" />
                    {FILTERS.map((f) => {
                        const count =
                            f.key === "all"
                                ? appointments.length
                                : appointments.filter((a) => a.status === f.key).length;
                        return (
                            <button
                                key={f.key}
                                onClick={() => setFilter(f.key)}
                                className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                                    filter === f.key
                                        ? "bg-[#4338CA] text-white"
                                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                }`}
                                data-testid={`filter-${f.key}`}
                            >
                                {f.label} ({count})
                            </button>
                        );
                    })}
                </div>

                {loading ? (
                    <div className="text-slate-500">Carregando...</div>
                ) : list.length === 0 ? (
                    <div className="card-default text-center py-16" data-testid="no-appointments">
                        <h3 className="font-bold text-slate-900 mb-1">
                            Sem agendamentos
                        </h3>
                        <p className="text-sm text-slate-500">
                            Nada para exibir neste filtro.
                        </p>
                    </div>
                ) : (
                    <div className="grid md:grid-cols-2 gap-4 stagger">
                        {list.map((a) => (
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
            </div>
        </div>
    );
}
