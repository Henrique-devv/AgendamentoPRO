import React, { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Clock, Tag, DollarSign, Eye, EyeOff } from "lucide-react";
import api, { formatApiError } from "@/lib/api";
import Navbar from "@/components/Navbar";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const empty = {
    name: "",
    description: "",
    duration_minutes: 60,
    price: 0,
    category: "Geral",
    active: true,
};

export default function ProviderServices() {
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(null); // null = closed, {} = new, {...} = edit
    const [form, setForm] = useState(empty);

    const load = async () => {
        setLoading(true);
        try {
            const me = await api.get("/auth/me");
            const { data } = await api.get("/services", {
                params: { provider_id: me.data.id },
            });
            setServices(data);
        } catch {
            toast.error("Erro ao carregar serviços");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, []);

    const openNew = () => {
        setForm(empty);
        setEditing({});
    };

    const openEdit = (s) => {
        setForm({
            name: s.name,
            description: s.description || "",
            duration_minutes: s.duration_minutes,
            price: s.price,
            category: s.category,
            active: s.active,
        });
        setEditing(s);
    };

    const submit = async () => {
        try {
            if (editing && editing.id) {
                await api.put(`/services/${editing.id}`, form);
                toast.success("Serviço atualizado");
            } else {
                await api.post("/services", form);
                toast.success("Serviço criado");
            }
            setEditing(null);
            load();
        } catch (err) {
            toast.error(formatApiError(err.response?.data?.detail));
        }
    };

    const remove = async (s) => {
        if (!window.confirm(`Excluir serviço "${s.name}"?`)) return;
        try {
            await api.delete(`/services/${s.id}`);
            toast.success("Excluído");
            load();
        } catch (err) {
            toast.error(err.response?.data?.detail || "Erro");
        }
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC]">
            <Navbar />
            <div className="max-w-7xl mx-auto px-6 lg:px-8 py-10">
                <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
                    <div>
                        <div className="label-uppercase mb-2">Prestador</div>
                        <h1 className="font-heading text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
                            Meus Serviços
                        </h1>
                        <p className="text-slate-600 mt-1">
                            Cadastre e gerencie os serviços que você oferece.
                        </p>
                    </div>
                    <Button
                        onClick={openNew}
                        className="btn-primary inline-flex items-center gap-2"
                        data-testid="new-service-btn"
                    >
                        <Plus size={16} />
                        Novo serviço
                    </Button>
                </div>

                {loading ? (
                    <div className="text-slate-500">Carregando...</div>
                ) : services.length === 0 ? (
                    <div className="card-default text-center py-16" data-testid="no-services">
                        <Tag className="w-10 h-10 mx-auto text-slate-300 mb-3" />
                        <h3 className="font-heading font-bold text-slate-900 mb-1">
                            Nenhum serviço cadastrado
                        </h3>
                        <p className="text-sm text-slate-500 mb-4">
                            Comece criando seu primeiro serviço.
                        </p>
                        <Button onClick={openNew} className="btn-primary" data-testid="empty-new-btn">
                            <Plus size={16} className="mr-1" />
                            Criar serviço
                        </Button>
                    </div>
                ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 stagger">
                        {services.map((s) => (
                            <div
                                key={s.id}
                                className="card-default"
                                data-testid={`service-row-${s.id}`}
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.2em] font-bold text-[#4338CA] bg-[#4338CA]/8 px-2.5 py-1 rounded-md">
                                        <Tag size={10} />
                                        {s.category}
                                    </span>
                                    <span
                                        className={`inline-flex items-center gap-1 text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded-md ${
                                            s.active
                                                ? "bg-emerald-50 text-emerald-700"
                                                : "bg-slate-100 text-slate-600"
                                        }`}
                                    >
                                        {s.active ? <Eye size={10} /> : <EyeOff size={10} />}
                                        {s.active ? "Ativo" : "Inativo"}
                                    </span>
                                </div>
                                <h3 className="font-heading font-bold text-lg text-slate-900 mb-1">
                                    {s.name}
                                </h3>
                                <p className="text-sm text-slate-600 line-clamp-2 mb-3">
                                    {s.description || "Sem descrição"}
                                </p>
                                <div className="flex items-center gap-3 text-xs text-slate-500 mb-4">
                                    <span className="inline-flex items-center gap-1 font-semibold">
                                        <Clock size={12} />
                                        {s.duration_minutes}min
                                    </span>
                                    <span className="inline-flex items-center gap-1 font-semibold">
                                        <DollarSign size={12} />
                                        R$ {Number(s.price).toFixed(2)}
                                    </span>
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => openEdit(s)}
                                        className="rounded-xl flex-1"
                                        data-testid={`edit-service-btn-${s.id}`}
                                    >
                                        <Pencil size={13} className="mr-1" />
                                        Editar
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => remove(s)}
                                        className="rounded-xl border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                                        data-testid={`delete-service-btn-${s.id}`}
                                    >
                                        <Trash2 size={13} />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
                <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="font-heading text-xl">
                            {editing?.id ? "Editar serviço" : "Novo serviço"}
                        </DialogTitle>
                        <DialogDescription>
                            Informe os detalhes do serviço oferecido.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div>
                            <label className="label-uppercase block mb-2">Nome</label>
                            <input
                                type="text"
                                value={form.name}
                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                                className="input-base"
                                placeholder="Ex: Consulta nutricional"
                                data-testid="form-service-name"
                            />
                        </div>
                        <div>
                            <label className="label-uppercase block mb-2">Categoria</label>
                            <input
                                type="text"
                                value={form.category}
                                onChange={(e) => setForm({ ...form, category: e.target.value })}
                                className="input-base"
                                placeholder="Ex: Saúde, Beleza, Educação..."
                                data-testid="form-service-category"
                            />
                        </div>
                        <div>
                            <label className="label-uppercase block mb-2">Descrição</label>
                            <textarea
                                value={form.description}
                                onChange={(e) => setForm({ ...form, description: e.target.value })}
                                className="input-base resize-none"
                                rows={3}
                                placeholder="Descreva o serviço..."
                                data-testid="form-service-description"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="label-uppercase block mb-2">
                                    Duração (min)
                                </label>
                                <input
                                    type="number"
                                    min={15}
                                    max={480}
                                    step={15}
                                    value={form.duration_minutes}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            duration_minutes: parseInt(e.target.value, 10) || 0,
                                        })
                                    }
                                    className="input-base"
                                    data-testid="form-service-duration"
                                />
                            </div>
                            <div>
                                <label className="label-uppercase block mb-2">Preço (R$)</label>
                                <input
                                    type="number"
                                    min={0}
                                    step={0.01}
                                    value={form.price}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            price: parseFloat(e.target.value) || 0,
                                        })
                                    }
                                    className="input-base"
                                    data-testid="form-service-price"
                                />
                            </div>
                        </div>
                        <label className="inline-flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={form.active}
                                onChange={(e) =>
                                    setForm({ ...form, active: e.target.checked })
                                }
                                className="w-4 h-4 accent-[#4338CA]"
                                data-testid="form-service-active"
                            />
                            <span className="text-sm text-slate-700 font-medium">
                                Ativo (visível no catálogo público)
                            </span>
                        </label>
                    </div>
                    <div className="flex justify-end gap-2">
                        <Button
                            variant="outline"
                            onClick={() => setEditing(null)}
                            className="rounded-xl"
                        >
                            Cancelar
                        </Button>
                        <Button
                            onClick={submit}
                            className="btn-primary rounded-xl"
                            data-testid="save-service-btn"
                        >
                            Salvar
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
