import React from "react";
import { Link } from "react-router-dom";
import { Clock, ArrowRight, Tag } from "lucide-react";
import RatingStars from "@/components/RatingStars";

export default function ServiceCard({ service }) {
    return (
        <Link
            to={`/services/${service.id}`}
            className="card-interactive flex flex-col gap-4 group"
            data-testid={`service-card-${service.id}`}
        >
            <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                    <span
                        className="inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.2em] font-bold text-[#4338CA] bg-[#4338CA]/8 px-2.5 py-1 rounded-md"
                        data-testid={`service-category-${service.id}`}
                    >
                        <Tag size={10} />
                        {service.category}
                    </span>
                </div>
                <div className="text-right">
                    <div className="text-[11px] uppercase tracking-wider text-slate-500 font-bold">
                        Valor
                    </div>
                    <div className="text-2xl font-heading font-extrabold text-slate-900">
                        R$ {Number(service.price).toFixed(2)}
                    </div>
                </div>
            </div>

            <div className="space-y-1">
                <h3
                    className="font-heading text-xl font-bold text-slate-900 group-hover:text-[#4338CA] transition-colors leading-tight"
                    data-testid={`service-name-${service.id}`}
                >
                    {service.name}
                </h3>
                <p className="text-sm text-slate-600 line-clamp-2">
                    {service.description || "Sem descrição"}
                </p>
            </div>

            <div className="flex items-center justify-between pt-3 mt-auto border-t border-slate-100">
                <div className="flex items-center gap-3 text-xs text-slate-500">
                    <span className="inline-flex items-center gap-1 font-semibold">
                        <Clock size={13} />
                        {service.duration_minutes}min
                    </span>
                    <span className="font-semibold">
                        por <span className="text-slate-700">{service.provider_name}</span>
                    </span>
                </div>
                <RatingStars
                    rating={service.avg_rating || 0}
                    count={service.review_count || 0}
                    size={12}
                />
            </div>

            <div className="text-sm font-semibold text-[#4338CA] inline-flex items-center gap-1 group-hover:gap-2 transition-all">
                Reservar agora <ArrowRight size={14} />
            </div>
        </Link>
    );
}
