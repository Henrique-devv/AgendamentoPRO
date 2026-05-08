import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { CalendarClock, Mail, Lock, ArrowLeft, ArrowRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { formatApiError } from "@/lib/api";
import { toast } from "sonner";

const HERO_IMAGE =
    "https://static.prod-images.emergentagent.com/jobs/8fcc6aa0-d3c0-4ee2-9d28-8273e4f4c56c/images/3efd182ab5d2c9fa942e30864690a3de4868f2c9b297ff625fa61998de12e074.png";

export default function Login() {
    const { login } = useAuth();
    const nav = useNavigate();
    const loc = useLocation();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const submit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            const u = await login(email, password);
            toast.success(`Bem-vindo, ${u.name}!`);
            const target = u.role === "provider" ? "/provider" : "/customer";
            nav(loc.state?.from || target, { replace: true });
        } catch (err) {
            const msg = formatApiError(err.response?.data?.detail) || err.message;
            setError(msg);
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex bg-white">
            {/* LEFT - Form */}
            <div className="flex-1 flex flex-col px-6 py-8 lg:px-16 lg:py-12 max-w-2xl">
                <Link
                    to="/"
                    className="inline-flex items-center gap-2.5 mb-12"
                    data-testid="back-home-link"
                >
                    <div className="w-9 h-9 rounded-xl bg-[#4338CA] flex items-center justify-center text-white shadow-md">
                        <CalendarClock className="w-5 h-5" />
                    </div>
                    <span className="font-heading font-extrabold text-lg tracking-tight text-slate-900">
                        Agenda<span className="text-[#FF5A5F]">Pro</span>
                    </span>
                </Link>

                <div className="flex-1 flex items-center">
                    <div className="w-full max-w-md mx-auto">
                        <Link
                            to="/"
                            className="text-sm font-semibold text-slate-500 hover:text-[#4338CA] inline-flex items-center gap-1 mb-6"
                        >
                            <ArrowLeft size={14} />
                            Voltar
                        </Link>

                        <h1 className="font-heading text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 mb-2">
                            Bem-vindo de volta
                        </h1>
                        <p className="text-slate-500 mb-8">
                            Entre com suas credenciais para continuar.
                        </p>

                        <form onSubmit={submit} className="space-y-5" data-testid="login-form">
                            <div>
                                <label className="label-uppercase block mb-2">
                                    E-mail
                                </label>
                                <div className="relative">
                                    <Mail
                                        size={16}
                                        className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                                    />
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        placeholder="seu@email.com"
                                        className="input-base pl-11"
                                        data-testid="login-email-input"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="label-uppercase block mb-2">
                                    Senha
                                </label>
                                <div className="relative">
                                    <Lock
                                        size={16}
                                        className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                                    />
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        placeholder="••••••••"
                                        className="input-base pl-11"
                                        data-testid="login-password-input"
                                    />
                                </div>
                            </div>

                            {error && (
                                <div
                                    className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl p-3"
                                    data-testid="login-error"
                                >
                                    {error}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={loading}
                                className="btn-primary w-full inline-flex items-center justify-center gap-2"
                                data-testid="login-submit-btn"
                            >
                                {loading ? "Entrando..." : "Entrar"}
                                {!loading && <ArrowRight size={16} />}
                            </button>
                        </form>

                        <div className="mt-8 pt-6 border-t border-slate-100 text-center text-sm text-slate-500">
                            Não tem conta?{" "}
                            <Link
                                to="/register"
                                className="font-bold text-[#4338CA] hover:underline"
                                data-testid="goto-register-link"
                            >
                                Cadastre-se grátis
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* RIGHT - Hero image */}
            <div className="hidden lg:flex flex-1 relative bg-gradient-to-br from-[#4338CA]/5 to-[#FF5A5F]/5 items-center justify-center p-12 overflow-hidden">
                <div className="hero-orb bg-[#4338CA] w-[400px] h-[400px] -top-20 -right-20" />
                <div className="hero-orb bg-[#FF5A5F] w-[300px] h-[300px] -bottom-20 -left-10" />
                <div className="relative max-w-md">
                    <img
                        src={HERO_IMAGE}
                        alt="AgendaPro"
                        className="w-full h-auto rounded-3xl shadow-2xl"
                    />
                    <div className="mt-6 text-center">
                        <h2 className="font-heading text-2xl font-extrabold text-slate-900 mb-2">
                            Sua agenda, sob controle
                        </h2>
                        <p className="text-slate-600">
                            Gerencie serviços, horários e clientes em um só lugar.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
