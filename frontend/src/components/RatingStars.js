import React from "react";
import { Star } from "lucide-react";

export default function RatingStars({ rating = 0, size = 14, showValue = false, count }) {
    const r = Math.round(Number(rating) * 2) / 2;
    return (
        <div className="inline-flex items-center gap-1.5" data-testid="rating-stars">
            <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((i) => (
                    <Star
                        key={i}
                        size={size}
                        className={
                            i <= r
                                ? "fill-[#FF5A5F] text-[#FF5A5F]"
                                : "text-slate-300"
                        }
                    />
                ))}
            </div>
            {showValue && (
                <span className="text-sm font-semibold text-slate-700">
                    {Number(rating).toFixed(1)}
                </span>
            )}
            {typeof count === "number" && count > 0 && (
                <span className="text-xs text-slate-500">({count})</span>
            )}
        </div>
    );
}
