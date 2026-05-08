import React, { useEffect, useState } from "react";
import { Save, Clock, Plus, Trash2 } from "lucide-react";
import api, { formatApiError } from "@/lib/api";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const DAYS = [
    { idx: 0, label: "Segunda" },
    { idx: 1, label: "Terça" },
    { idx: 2, label: "Quarta" },
    { idx: 3, label: "Quinta" },
    { idx: 4, label: "Sexta" },
    { idx: 5, label: "Sábado" },
    { idx: 6, label: "Domingo" },
];

export default function ProviderAvailability() {
    const [windowsByDay, setWindowsByDay] = useState({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const load = async () => {
        setLoading(true);
        try {
            const me = await api.get("/auth/me");
            const { data } = await api.get(`/providers/${me.data.id}/availability`);
            const map = {};
            DAYS.forEach((d) => (map[d.idx] = []));
            data.forEach((w) => {
                map[w.day_of_week].push({ start_time: w.start_time, end_time: w.end_time });
            });
            setWindowsByDay(map);
        } catch {
            toast.error("Erro ao carregar horários");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, []);

    const addWindow = (dayIdx) => {
        setWindowsByDay((prev) => ({
            ...prev,
            [dayIdx]: [...(prev[dayIdx] || []), { start_time: "09:00", end_time: "17:00" }],
        }));
    };
    const removeWindow = (dayIdx, i) => {
        setWindowsByDay((prev) => ({
            ...prev,
            [dayIdx]: prev[dayIdx].filter((_, idx) => idx !== i),
        }));
    };
    const updateWindow = (dayIdx, i, key, value) => {
        setWindowsByDay((prev) => ({
            ...prev,
            [dayIdx]: prev[dayIdx].map((w, idx) =>
                idx === i ? { ...w, [key]: value } : w
            ),
        }));
    };

    const save = async () => {
        const windows = [];
        Object.entries(windowsByDay).forEach(([dow, arr]) => {
            arr.forEach((w) => {
                windows.push({
                    day_of_week: parseInt(dow, 10),
                    start_time: w.start_time,
                    end_time: w.end_time,
                });
            });
        });
        setSaving(true);
        try {
            await api.put("/availability", { windows });
            toast.success("Horários atualizados!");
        } catch (err) {
            toast.error(formatApiError(err.response?.data?.detail));
        } finally {
            setSaving(false);
        }
    };

    const applyPreset = () => {
        const preset = {};
        DAYS.forEach((d) => {
            preset[d.idx] = d.idx <= 4 ? [{ start_time: "09:00", end_time: "18:00" }] : [];
        });
        setWindowsByDay(preset);
        toast.info("Preset comercial aplicado. Não esqueça de salvar!");
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC]">
            <Navbar />
            <div className="max-w-5xl mx-auto px-6 lg:px-8 py-10">
                <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
                    <div>
                        <div className="label-uppercase mb-2">Prestador</div>
                        <h1 className="font-heading text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
                            Horários Disponíveis
                        </h1>
                        <p className="text-slate-600 mt-1">
                            Configure quando você está disponível para atendimentos.
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            onClick={applyPreset}
                            className="rounded-xl"
                            data-testid="preset-btn"
                        >
                            Preset comercial
                        </Button>
                        <Button
                            onClick={save}
                            disabled={saving}
                            className="btn-primary inline-flex items-center gap-2"
                            data-testid="save-availability-btn"
                        >
                            <Save size={16} />
                            {saving ? "Salvando..." : "Salvar"}
                        </Button>
                    </div>
                </div>

                {loading ? (
                    <div className="text-slate-500">Carregando...</div>
                ) : (
                    <div className="space-y-3">
                        {DAYS.map((d) => {
                            const windows = windowsByDay[d.idx] || [];
                            return (
                                <div
                                    key={d.idx}
                                    className="card-default"
                                    data-testid={`day-row-${d.idx}`}
                                >
                                    <div className="flex items-center justify-between mb-3">
                                        <h3 className="font-heading font-bold text-slate-900">
                                            {d.label}
                                        </h3>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => addWindow(d.idx)}
                                            className="rounded-xl"
                                            data-testid={`add-window-btn-${d.idx}`}
                                        >
                                            <Plus size={13} className="mr-1" />
                                            Adicionar faixa
                                        </Button>
                                    </div>
                                    {windows.length === 0 ? (
                                        <div className="text-sm text-slate-400">
                                            Sem atendimento
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            {windows.map((w, i) => (
                                                <div
                                                    key={i}
                                                    className="flex items-center gap-3 flex-wrap"
                                                >
                                                    <Clock size={14} className="text-[#4338CA]" />
                                                    <input
                                                        type="time"
                                                        value={w.start_time}
                                                        onChange={(e) =>
                                                            updateWindow(d.idx, i, "start_time", e.target.value)
                                                        }
                                                        className="input-base w-32"
                                                        data-testid={`start-time-${d.idx}-${i}`}
                                                    />
                                                    <span className="text-slate-400 font-bold">→</span>
                                                    <input
                                                        type="time"
                                                        value={w.end_time}
                                                        onChange={(e) =>
                                                            updateWindow(d.idx, i, "end_time", e.target.value)
                                                        }
                                                        className="input-base w-32"
                                                        data-testid={`end-time-${d.idx}-${i}`}
                                                    />
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => removeWindow(d.idx, i)}
                                                        className="rounded-xl border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                                                        data-testid={`remove-window-${d.idx}-${i}`}
                                                    >
                                                        <Trash2 size={13} />
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
