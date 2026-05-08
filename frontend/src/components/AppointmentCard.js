import React from "react";
import {
    Calendar,
    Clock,
    User,
    DollarSign,
    CheckCircle2,
    XCircle,
    AlertCircle,
    Award,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const statusConfig = {
    pending: { label: "Aguardando", color: "bg-amber-50 text-amber-700 border-amber-200", icon: AlertCircle },
    confirmed: { label: "Confirmado", color: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: CheckCircle2 },
    cancelled: { label: "Cancelado", color: "bg-red-50 text-red-700 border-red-200", icon: XCircle },
    completed: { label: "Concluído", color: "bg-slate-100 text-slate-700 border-slate-200", icon: Award },
};

export default function AppointmentCard({
    appointment,
    role,
    onCancel,
    onReschedule,
    onConfirm,
    onComplete,
    onReview,
    hasReview,
}) {
    const status = statusConfig[appointment.status] || statusConfig.pending;
    const StatusIcon = status.icon;
    const date = new Date(appointment.date + "T00:00:00");
    const dateLabel = date.toLocaleDateString("pt-BR", {
        weekday: "short",
        day: "2-digit",
        month: "short",
    });

    const otherName =
        role === "customer" ? appointment.provider_name : appointment.customer_name;

    return (
        <div className="card-default" data-testid={`appointment-card-${appointment.id}`}>
            <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex-1">
                    <h3 className="font-heading text-lg font-bold text-slate-900 leading-tight">
                        {appointment.service_name}
                    </h3>
                    <div className="flex items-center gap-1.5 mt-1 text-sm text-slate-500">
                        <User size={13} />
                        <span>
                            {role === "customer" ? "com " : ""}
                            <span className="font-semibold text-slate-700">{otherName}</span>
                        </span>
                    </div>
                </div>
                <span
                    className={`badge-status border ${status.color}`}
                    data-testid={`status-badge-${appointment.id}`}
                >
                    <StatusIcon size={12} />
                    {status.label}
                </span>
            </div>

            <div className="grid grid-cols-3 gap-3 py-3 border-y border-slate-100">
                <div>
                    <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-0.5">
                        Data
                    </div>
                    <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-900 capitalize">
                        <Calendar size={13} className="text-[#4338CA]" />
                        {dateLabel}
                    </div>
                </div>
                <div>
                    <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-0.5">
                        Horário
                    </div>
                    <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-900">
                        <Clock size={13} className="text-[#4338CA]" />
                        {appointment.start_time}
                    </div>
                </div>
                <div>
                    <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-0.5">
                        Valor
                    </div>
                    <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-900">
                        <DollarSign size={13} className="text-[#4338CA]" />
                        R$ {Number(appointment.service_price || 0).toFixed(2)}
                    </div>
                </div>
            </div>

            {appointment.notes && (
                <div className="mt-3 p-3 bg-slate-50 rounded-lg text-sm text-slate-600">
                    <span className="font-semibold text-slate-700">Observação:</span> {appointment.notes}
                </div>
            )}

            <div className="flex flex-wrap gap-2 mt-4">
                {role === "provider" && appointment.status === "pending" && (
                    <Button
                        onClick={() => onConfirm?.(appointment)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl"
                        size="sm"
                        data-testid={`confirm-btn-${appointment.id}`}
                    >
                        <CheckCircle2 size={14} className="mr-1" />
                        Confirmar
                    </Button>
                )}
                {role === "provider" && (appointment.status === "pending" || appointment.status === "confirmed") && (
                    <Button
                        onClick={() => onComplete?.(appointment)}
                        className="bg-[#4338CA] hover:bg-[#3730A3] text-white rounded-xl"
                        size="sm"
                        data-testid={`complete-btn-${appointment.id}`}
                    >
                        <Award size={14} className="mr-1" />
                        Marcar concluído
                    </Button>
                )}
                {(appointment.status === "pending" || appointment.status === "confirmed") && (
                    <>
                        <Button
                            variant="outline"
                            onClick={() => onReschedule?.(appointment)}
                            className="rounded-xl border-slate-300"
                            size="sm"
                            data-testid={`reschedule-btn-${appointment.id}`}
                        >
                            <Calendar size={14} className="mr-1" />
                            Reagendar
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => onCancel?.(appointment)}
                            className="rounded-xl border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                            size="sm"
                            data-testid={`cancel-btn-${appointment.id}`}
                        >
                            <XCircle size={14} className="mr-1" />
                            Cancelar
                        </Button>
                    </>
                )}
                {role === "customer" && appointment.status === "completed" && !hasReview && (
                    <Button
                        onClick={() => onReview?.(appointment)}
                        className="bg-[#FF5A5F] hover:bg-[#E0484D] text-white rounded-xl"
                        size="sm"
                        data-testid={`review-btn-${appointment.id}`}
                    >
                        <Award size={14} className="mr-1" />
                        Avaliar serviço
                    </Button>
                )}
            </div>
        </div>
    );
}
