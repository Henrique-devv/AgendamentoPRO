import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CalendarClock, Mail, Lock, User, Phone, ArrowLeft, ArrowRight, Briefcase, ShoppingBag } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { formatApiError } from "@/lib/api";
import { toast } from "sonner";

const HERO_IMAGE =
    "https://static.prod-images.emergentagent.com/jobs/8fcc6aa0-d3c0-4ee2-9d28-8273e4f4c56c/images/3efd182ab5d2c9fa942e30864690a3de4868f2c9b297ff625fa61998de12e074.png";

export default function Register() {
    const { register } = useAuth();
    const nav = useNavigate();
    const [form, setForm] = useState({
        role: "customer",
        name: "",
        email: "",
        password: "",
        phone: "",
        bio: "",
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const submit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            const u = await register(form);
            toast.success(`Conta criada! Olá, ${u.name}`);
            nav(u.role === "provider" ? "/provider" : "/customer", { replace: true });
        } catch (err) {
            const msg = formatApiError(err.response?.data?.detail) || err.message;
            setError(msg);
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    const setRole = (role) => setForm({ ...form, role });

    return (
        <div className="min-h-screen flex bg-white">
            {/* LEFT - Form */}
            <div className="flex-1 flex flex-col px-6 py-8 lg:px-16 lg:py-10 max-w-2xl overflow-y-auto">
                <Link
                    to="/"
                    className="inline-flex items-center gap-2.5 mb-8"
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
                            className="text-sm font-semibold text-slate-500 hover:text-[#4338CA] inline-flex items-center gap-1 mb-4"
                        >
                            <ArrowLeft size={14} />
                            Voltar
                        </Link>

                        <h1 className="font-heading text-3xl font-extrabold tracking-tight text-slate-900 mb-2">
                            Criar sua conta
                        </h1>
                        <p className="text-slate-500 mb-6">
                            Escolha como você quer usar o AgendaPro.
                        </p>

                        {/* Role selector */}
                        <div className="grid grid-cols-2 gap-3 mb-6" data-testid="role-selector">
                            <button
                                type="button"
                                onClick={() => setRole("customer")}
                                className={`p-4 rounded-2xl border-2 text-left transition-all ${
                                    form.role === "customer"
                                        ? "border-[#4338CA] bg-[#4338CA]/5"
                                        : "border-slate-200 hover:border-slate-300"
                                }`}
                                data-testid="role-customer-btn"
                            >
                                <ShoppingBag className={`w-5 h-5 mb-2 ${form.role === "customer" ? "text-[#4338CA]" : "text-slate-500"}`} />
                                <div className="font-heading font-bold text-slate-900 text-sm">
                                    Sou Cliente
                                </div>
                                <div className="text-xs text-slate-500">
                                    Quero agendar serviços
                                </div>
                            </button>
                            <button
                                type="button"
                                onClick={() => setRole("provider")}
                                className={`p-4 rounded-2xl border-2 text-left transition-all ${
                                    form.role === "provider"
                                        ? "border-[#FF5A5F] bg-[#FF5A5F]/5"
                                        : "border-slate-200 hover:border-slate-300"
                                }`}
                                data-testid="role-provider-btn"
                            >
                                <Briefcase className={`w-5 h-5 mb-2 ${form.role === "provider" ? "text-[#FF5A5F]" : "text-slate-500"}`} />
                                <div className="font-heading font-bold text-slate-900 text-sm">
                                    Sou Prestador
                                </div>
                                <div className="text-xs text-slate-500">
                                    Ofereço serviços
                                </div>
                            </button>
                        </div>

                        <form onSubmit={submit} className="space-y-4" data-testid="register-form">
                            <div className="grid grid-cols-1 gap-4">
                                <div>
                                    <label className="label-uppercase block mb-2">Nome</label>
                                    <div className="relative">
                                        <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input
                                            type="text"
                                            value={form.name}
                                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                                            required
                                            placeholder="Seu nome completo"
                                            className="input-base pl-11"
                                            data-testid="register-name-input"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="label-uppercase block mb-2">E-mail</label>
                                    <div className="relative">
                                        <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input
                                            type="email"
                                            value={form.email}
                                            onChange={(e) => setForm({ ...form, email: e.target.value })}
                                            required
                                            placeholder="seu@email.com"
                                            className="input-base pl-11"
                                            data-testid="register-email-input"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="label-uppercase block mb-2">Senha (mín. 6)</label>
                                    <div className="relative">
                                        <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input
                                            type="password"
                                            value={form.password}
                                            onChange={(e) => setForm({ ...form, password: e.target.value })}
                                            required
                                            minLength={6}
                                            placeholder="••••••••"
                                            className="input-base pl-11"
                                            data-testid="register-password-input"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="label-uppercase block mb-2">Telefone (opcional)</label>
                                    <div className="relative">
                                        <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input
                                            type="tel"
                                            value={form.phone}
                                            onChange={(e) => setForm({ ...form, phone: e.target.value })}
                                            placeholder="(11) 9 0000-0000"
                                            className="input-base pl-11"
                                            data-testid="register-phone-input"
                                        />
                                    </div>
                                </div>
                                {form.role === "provider" && (
                                    <div>
                                        <label className="label-uppercase block mb-2">Bio / Sobre seu negócio</label>
                                        <textarea
                                            value={form.bio}
                                            onChange={(e) => setForm({ ...form, bio: e.target.value })}
                                            placeholder="Apresente-se aos seus clientes..."
                                            rows={3}
                                            className="input-base resize-none"
                                            data-testid="register-bio-input"
                                        />
                                    </div>
                                )}
                            </div>

                            {error && (
                                <div
                                    className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl p-3"
                                    data-testid="register-error"
                                >
                                    {error}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={loading}
                                className="btn-primary w-full inline-flex items-center justify-center gap-2"
                                data-testid="register-submit-btn"
                            >
                                {loading ? "Criando conta..." : "Criar conta"}
                                {!loading && <ArrowRight size={16} />}
                            </button>
                        </form>

                        <div className="mt-6 pt-5 border-t border-slate-100 text-center text-sm text-slate-500">
                            Já tem conta?{" "}
                            <Link to="/login" className="font-bold text-[#4338CA] hover:underline" data-testid="goto-login-link">
                                Entrar
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* RIGHT image */}
            <div className="hidden lg:flex flex-1 relative bg-gradient-to-br from-[#4338CA]/5 to-[#FF5A5F]/5 items-center justify-center p-12 overflow-hidden">
                <div className="hero-orb bg-[#4338CA] w-[400px] h-[400px] -top-20 -right-20" />
                <div className="hero-orb bg-[#FF5A5F] w-[300px] h-[300px] -bottom-20 -left-10" />
                <div className="relative max-w-md">
                    <img src={HERO_IMAGE} alt="AgendaPro" className="w-full h-auto rounded-3xl shadow-2xl" />
                </div>
            </div>
        </div>
    );
}
