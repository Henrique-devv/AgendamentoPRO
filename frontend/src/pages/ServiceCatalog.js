import React, { useEffect, useState } from "react";
import { Search, Sparkles, Filter } from "lucide-react";
import api from "@/lib/api";
import Navbar from "@/components/Navbar";
import ServiceCard from "@/components/ServiceCard";

export default function ServiceCatalog() {
    const [services, setServices] = useState([]);
    const [search, setSearch] = useState("");
    const [category, setCategory] = useState("all");
    const [loading, setLoading] = useState(true);

    const load = async () => {
        setLoading(true);
        try {
            const params = {};
            if (search) params.search = search;
            if (category && category !== "all") params.category = category;
            const { data } = await api.get("/services", { params });
            setServices(data);
        } catch {
            setServices([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const t = setTimeout(load, 250);
        return () => clearTimeout(t);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search, category]);

    const categories = [
        "all",
        ...Array.from(new Set(services.map((s) => s.category))).filter(Boolean),
    ];

    return (
        <div className="min-h-screen bg-[#F8FAFC]">
            <Navbar />
            <div className="max-w-7xl mx-auto px-6 lg:px-8 pt-10 pb-16">
                <div className="mb-8">
                    <div className="label-uppercase mb-2">Catálogo</div>
                    <h1 className="font-heading text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900 mb-2">
                        Encontre o serviço{" "}
                        <span className="text-[#FF5A5F]">perfeito</span>
                    </h1>
                    <p className="text-slate-600">
                        Navegue por categorias e reserve com profissionais verificados.
                    </p>
                </div>

                {/* Filters */}
                <div className="card-default mb-8 flex flex-col md:flex-row gap-3">
                    <div className="relative flex-1">
                        <Search
                            size={16}
                            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                        />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Buscar serviço..."
                            className="input-base pl-11"
                            data-testid="services-search-input"
                        />
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                        <Filter size={14} className="text-slate-400" />
                        {categories.map((c) => (
                            <button
                                key={c}
                                onClick={() => setCategory(c)}
                                className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                                    category === c
                                        ? "bg-[#4338CA] text-white"
                                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                }`}
                                data-testid={`category-filter-${c}`}
                            >
                                {c === "all" ? "Todos" : c}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Results */}
                {loading ? (
                    <div className="text-center py-16 text-slate-500">
                        Carregando serviços...
                    </div>
                ) : services.length === 0 ? (
                    <div className="card-default text-center py-16" data-testid="services-empty-state">
                        <Sparkles className="w-10 h-10 mx-auto text-slate-300 mb-3" />
                        <h3 className="font-heading font-bold text-slate-900 mb-1">
                            Nenhum serviço encontrado
                        </h3>
                        <p className="text-sm text-slate-500">
                            Tente ajustar os filtros ou voltar mais tarde.
                        </p>
                    </div>
                ) : (
                    <div
                        className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 stagger"
                        data-testid="services-grid"
                    >
                        {services.map((s) => (
                            <ServiceCard key={s.id} service={s} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
