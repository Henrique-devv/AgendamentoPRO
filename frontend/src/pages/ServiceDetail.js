import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Clock, ArrowLeft, ArrowRight, Tag, User, MessageSquareQuote } from "lucide-react";
import api from "@/lib/api";
import Navbar from "@/components/Navbar";
import RatingStars from "@/components/RatingStars";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export default function ServiceDetail() {
    const { id } = useParams();
    const nav = useNavigate();
    const { user } = useAuth();
    const [service, setService] = useState(null);
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                const [s, r] = await Promise.all([
                    api.get(`/services/${id}`),
                    api.get(`/services/${id}/reviews`),
                ]);
                setService(s.data);
                setReviews(r.data);
            } catch {
                toast.error("Não foi possível carregar o serviço");
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [id]);

    const onBook = () => {
        if (!user) return nav("/login");
        if (user.role !== "customer") {
            toast.error("Apenas clientes podem reservar");
            return;
        }
        nav(`/book/${id}`);
    };

    if (loading)
        return (
            <div className="min-h-screen bg-[#F8FAFC]">
                <Navbar />
                <div className="max-w-5xl mx-auto px-6 py-16 text-center text-slate-500">
                    Carregando...
                </div>
            </div>
        );

    if (!service)
        return (
            <div className="min-h-screen bg-[#F8FAFC]">
                <Navbar />
                <div className="max-w-5xl mx-auto px-6 py-16 text-center">
                    <p className="text-slate-600">Serviço não encontrado.</p>
                    <Link to="/services" className="btn-primary mt-4 inline-block">
                        Ver catálogo
                    </Link>
                </div>
            </div>
        );

    return (
        <div className="min-h-screen bg-[#F8FAFC]">
            <Navbar />
            <div className="max-w-5xl mx-auto px-6 lg:px-8 py-10">
                <Link
                    to="/services"
                    className="text-sm font-semibold text-slate-500 hover:text-[#4338CA] inline-flex items-center gap-1 mb-6"
                    data-testid="back-to-catalog-link"
                >
                    <ArrowLeft size={14} />
                    Voltar ao catálogo
                </Link>

                <div className="grid lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-5">
                        <div className="card-default">
                            <div className="flex items-center gap-2 mb-3">
                                <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.2em] font-bold text-[#4338CA] bg-[#4338CA]/8 px-2.5 py-1 rounded-md">
                                    <Tag size={10} />
                                    {service.category}
                                </span>
                                <RatingStars
                                    rating={service.avg_rating || 0}
                                    count={service.review_count || 0}
                                    size={13}
                                    showValue
                                />
                            </div>
                            <h1
                                className="font-heading text-3xl sm:text-4xl font-extrabold text-slate-900 mb-3 leading-tight"
                                data-testid="service-title"
                            >
                                {service.name}
                            </h1>
                            <div className="flex items-center gap-4 text-sm text-slate-600 mb-5">
                                <span className="inline-flex items-center gap-1.5">
                                    <Clock size={14} className="text-[#4338CA]" />
                                    {service.duration_minutes} minutos
                                </span>
                                <span className="inline-flex items-center gap-1.5">
                                    <User size={14} className="text-[#4338CA]" />
                                    {service.provider_name}
                                </span>
                            </div>
                            <p className="text-slate-700 leading-relaxed whitespace-pre-line">
                                {service.description || "Sem descrição."}
                            </p>
                        </div>

                        {/* Reviews */}
                        <div className="card-default">
                            <h2 className="font-heading text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                                <MessageSquareQuote size={18} className="text-[#4338CA]" />
                                Avaliações
                                <span className="text-sm font-normal text-slate-500">
                                    ({reviews.length})
                                </span>
                            </h2>
                            {reviews.length === 0 ? (
                                <p className="text-sm text-slate-500" data-testid="no-reviews">
                                    Ainda sem avaliações.
                                </p>
                            ) : (
                                <div className="space-y-4">
                                    {reviews.map((r) => (
                                        <div
                                            key={r.id}
                                            className="border-b border-slate-100 pb-4 last:border-0"
                                            data-testid={`review-${r.id}`}
                                        >
                                            <div className="flex items-center justify-between mb-1.5">
                                                <span className="font-bold text-slate-900 text-sm">
                                                    {r.customer_name}
                                                </span>
                                                <RatingStars rating={r.rating} size={12} />
                                            </div>
                                            <p className="text-sm text-slate-600">{r.comment || "—"}</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <aside>
                        <div className="card-default sticky top-24">
                            <div className="text-xs uppercase tracking-wider text-slate-500 font-bold mb-1">
                                Valor
                            </div>
                            <div className="font-heading text-4xl font-extrabold text-slate-900 mb-4">
                                R$ {Number(service.price).toFixed(2)}
                            </div>
                            <button
                                onClick={onBook}
                                className="btn-coral w-full inline-flex items-center justify-center gap-2"
                                data-testid="book-now-btn"
                            >
                                Reservar agora <ArrowRight size={16} />
                            </button>
                            <p className="text-xs text-slate-500 mt-3 text-center">
                                Confirmação por e-mail · Cancelamento gratuito
                            </p>
                        </div>
                    </aside>
                </div>
            </div>
        </div>
    );
}
