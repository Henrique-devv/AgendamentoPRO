import React from "react";
import { Link } from "react-router-dom";
import {
    CalendarClock,
    Bell,
    Star,
    Users,
    ArrowRight,
    Sparkles,
    Calendar as CalendarIcon,
    Mail,
    Shield,
    Zap,
} from "lucide-react";
import Navbar from "@/components/Navbar";

const HERO_IMAGE =
    "https://static.prod-images.emergentagent.com/jobs/8fcc6aa0-d3c0-4ee2-9d28-8273e4f4c56c/images/3efd182ab5d2c9fa942e30864690a3de4868f2c9b297ff625fa61998de12e074.png";

export default function Landing() {
    const features = [
        {
            icon: CalendarClock,
            title: "Agenda Inteligente",
            text: "Cadastre serviços, defina horários e deixe seus clientes reservarem 24/7.",
        },
        {
            icon: Mail,
            title: "Notificações por E-mail",
            text: "Confirmações, lembretes e atualizações automáticas via SendGrid.",
        },
        {
            icon: Star,
            title: "Avaliações Reais",
            text: "Construa reputação com avaliações pós-atendimento dos clientes.",
        },
        {
            icon: Shield,
            title: "Painéis Separados",
            text: "Experiências dedicadas para clientes e prestadores.",
        },
    ];

    return (
        <div className="min-h-screen bg-white">
            <Navbar />

            {/* HERO */}
            <section className="relative overflow-hidden">
                <div className="hero-orb bg-[#4338CA] w-[500px] h-[500px] -top-40 -right-40" />
                <div className="hero-orb bg-[#FF5A5F] w-[400px] h-[400px] -bottom-32 -left-20" />

                <div className="relative max-w-7xl mx-auto px-6 lg:px-8 pt-16 pb-24 lg:pt-24 lg:pb-32">
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        <div className="space-y-7">
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#4338CA]/8 text-[#4338CA] text-xs font-bold uppercase tracking-[0.18em]">
                                <Sparkles size={12} />
                                Sistema de Agendamentos
                            </div>

                            <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.05]">
                                Agendamentos sem
                                <br />
                                fricção, com{" "}
                                <span className="relative inline-block">
                                    <span className="relative z-10 text-[#FF5A5F]">
                                        confirmação
                                    </span>
                                    <span className="absolute inset-x-0 bottom-1 h-3 bg-[#FF5A5F]/15 -z-0 rounded" />
                                </span>{" "}
                                automática.
                            </h1>

                            <p className="text-lg text-slate-600 leading-relaxed max-w-xl">
                                AgendaPro conecta clientes e prestadores com
                                cadastro de serviços, controle de horários,
                                notificações por e-mail e avaliações — tudo em
                                uma única plataforma.
                            </p>

                            <div className="flex flex-wrap gap-3">
                                <Link
                                    to="/register"
                                    className="btn-primary inline-flex items-center gap-2"
                                    data-testid="hero-register-btn"
                                >
                                    Criar conta grátis <ArrowRight size={16} />
                                </Link>
                                <Link
                                    to="/services"
                                    className="btn-outline inline-flex items-center gap-2"
                                    data-testid="hero-explore-btn"
                                >
                                    Explorar serviços
                                </Link>
                            </div>

                            <div className="flex items-center gap-6 pt-4">
                                <div>
                                    <div className="font-heading text-2xl font-extrabold text-slate-900">
                                        24/7
                                    </div>
                                    <div className="text-xs uppercase tracking-wider text-slate-500 font-bold">
                                        Reservas online
                                    </div>
                                </div>
                                <div className="w-px h-10 bg-slate-200" />
                                <div>
                                    <div className="font-heading text-2xl font-extrabold text-slate-900">
                                        2 min
                                    </div>
                                    <div className="text-xs uppercase tracking-wider text-slate-500 font-bold">
                                        Para reservar
                                    </div>
                                </div>
                                <div className="w-px h-10 bg-slate-200" />
                                <div>
                                    <div className="font-heading text-2xl font-extrabold text-slate-900">
                                        ∞
                                    </div>
                                    <div className="text-xs uppercase tracking-wider text-slate-500 font-bold">
                                        Serviços
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="relative">
                            <div className="absolute -inset-4 bg-gradient-to-br from-[#4338CA]/20 to-[#FF5A5F]/20 rounded-[2rem] blur-2xl" />
                            <div className="relative rounded-3xl overflow-hidden border border-slate-200 shadow-2xl bg-white">
                                <img
                                    src={HERO_IMAGE}
                                    alt="Agendamentos online"
                                    className="w-full h-auto object-cover"
                                />
                            </div>
                            <div className="absolute -bottom-4 -left-4 card-default bg-white animate-fade-up">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                                        <CalendarIcon className="w-5 h-5 text-emerald-600" />
                                    </div>
                                    <div>
                                        <div className="text-xs uppercase tracking-wider text-slate-500 font-bold">
                                            Próximo agendamento
                                        </div>
                                        <div className="text-sm font-bold text-slate-900">
                                            Amanhã, 14:30
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div
                                className="absolute -top-4 -right-4 card-default bg-white animate-fade-up"
                                style={{ animationDelay: "0.2s" }}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-[#FF5A5F]/10 flex items-center justify-center">
                                        <Bell className="w-5 h-5 text-[#FF5A5F]" />
                                    </div>
                                    <div>
                                        <div className="text-xs uppercase tracking-wider text-slate-500 font-bold">
                                            E-mail enviado
                                        </div>
                                        <div className="text-sm font-bold text-slate-900">
                                            Confirmação ✓
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* FEATURES */}
            <section className="py-20 bg-[#F8FAFC] border-y border-slate-100">
                <div className="max-w-7xl mx-auto px-6 lg:px-8">
                    <div className="max-w-2xl mb-12">
                        <div className="label-uppercase mb-3">
                            Recursos
                        </div>
                        <h2 className="font-heading text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
                            Tudo que você precisa para gerenciar agendamentos
                        </h2>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5 stagger">
                        {features.map((f) => (
                            <div key={f.title} className="card-default">
                                <div className="w-12 h-12 rounded-xl bg-[#4338CA]/8 flex items-center justify-center mb-4">
                                    <f.icon className="w-6 h-6 text-[#4338CA]" />
                                </div>
                                <h3 className="font-heading font-bold text-slate-900 mb-1.5">
                                    {f.title}
                                </h3>
                                <p className="text-sm text-slate-600 leading-relaxed">
                                    {f.text}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* HOW IT WORKS */}
            <section className="py-20">
                <div className="max-w-7xl mx-auto px-6 lg:px-8">
                    <div className="text-center max-w-2xl mx-auto mb-12">
                        <div className="label-uppercase mb-3">Como funciona</div>
                        <h2 className="font-heading text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
                            Reserve em 3 passos simples
                        </h2>
                    </div>

                    <div className="grid md:grid-cols-3 gap-6">
                        {[
                            {
                                n: "01",
                                title: "Crie sua conta",
                                text: "Como cliente para reservar ou prestador para vender serviços.",
                            },
                            {
                                n: "02",
                                title: "Configure ou explore",
                                text: "Prestadores cadastram serviços e horários. Clientes navegam o catálogo.",
                            },
                            {
                                n: "03",
                                title: "Receba confirmações",
                                text: "Notificações automáticas no e-mail a cada etapa do agendamento.",
                            },
                        ].map((s) => (
                            <div key={s.n} className="card-default relative">
                                <div className="absolute -top-3 left-6 px-3 py-1 rounded-full bg-[#FF5A5F] text-white text-xs font-bold tracking-widest">
                                    PASSO {s.n}
                                </div>
                                <h3 className="font-heading text-xl font-bold text-slate-900 mt-3 mb-2">
                                    {s.title}
                                </h3>
                                <p className="text-sm text-slate-600 leading-relaxed">
                                    {s.text}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="py-16">
                <div className="max-w-7xl mx-auto px-6 lg:px-8">
                    <div className="rounded-3xl bg-[#4338CA] p-10 lg:p-16 relative overflow-hidden">
                        <div className="absolute inset-0 opacity-20">
                            <div className="absolute top-0 right-0 w-96 h-96 bg-[#FF5A5F] rounded-full blur-3xl" />
                        </div>
                        <div className="relative grid lg:grid-cols-2 gap-8 items-center">
                            <div className="text-white space-y-3">
                                <Zap className="w-8 h-8 text-[#FF5A5F]" />
                                <h2 className="font-heading text-3xl sm:text-4xl font-extrabold tracking-tight">
                                    Pronto para começar?
                                </h2>
                                <p className="text-white/80 text-base max-w-md">
                                    Crie sua conta agora — leva menos de 1 minuto.
                                </p>
                            </div>
                            <div className="flex lg:justify-end gap-3">
                                <Link
                                    to="/register"
                                    className="bg-white text-[#4338CA] hover:bg-white/95 rounded-xl px-7 py-3.5 font-bold transition-all hover:-translate-y-0.5 shadow-md"
                                    data-testid="cta-register-btn"
                                >
                                    Criar conta grátis
                                </Link>
                                <Link
                                    to="/login"
                                    className="border border-white/30 text-white hover:bg-white/10 rounded-xl px-7 py-3.5 font-bold transition-all"
                                    data-testid="cta-login-btn"
                                >
                                    Entrar
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <footer className="border-t border-slate-200 py-8">
                <div className="max-w-7xl mx-auto px-6 lg:px-8 flex items-center justify-between text-sm text-slate-500">
                    <div className="flex items-center gap-2">
                        <CalendarClock className="w-4 h-4 text-[#4338CA]" />
                        <span className="font-bold text-slate-700">AgendaPro</span>
                    </div>
                    <span>© {new Date().getFullYear()} AgendaPro</span>
                </div>
            </footer>
        </div>
    );
}
