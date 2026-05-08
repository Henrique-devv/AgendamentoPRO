import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { CalendarClock, Menu, X, LogOut, LayoutDashboard, User } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Navbar() {
    const { user, logout } = useAuth();
    const nav = useNavigate();
    const location = useLocation();
    const [open, setOpen] = useState(false);

    const handleLogout = async () => {
        await logout();
        nav("/");
    };

    const dashUrl = user?.role === "provider" ? "/provider" : "/customer";

    return (
        <header className="header-glass" data-testid="main-navbar">
            <div className="max-w-7xl mx-auto px-6 lg:px-8 h-16 flex items-center justify-between">
                <Link
                    to="/"
                    className="flex items-center gap-2.5 group"
                    data-testid="logo-home-link"
                >
                    <div className="w-9 h-9 rounded-xl bg-[#4338CA] flex items-center justify-center text-white shadow-md group-hover:rotate-6 transition-transform">
                        <CalendarClock className="w-5 h-5" />
                    </div>
                    <span className="font-heading font-extrabold text-lg tracking-tight text-slate-900">
                        Agenda<span className="text-[#FF5A5F]">Pro</span>
                    </span>
                </Link>

                <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
                    <Link
                        to="/services"
                        className={`nav-link text-slate-600 hover:text-[#4338CA] ${location.pathname.startsWith("/services") ? "active text-[#4338CA]" : ""}`}
                        data-testid="nav-services-link"
                    >
                        Serviços
                    </Link>
                    {user && (
                        <Link
                            to={dashUrl}
                            className={`nav-link text-slate-600 hover:text-[#4338CA] ${location.pathname.startsWith(dashUrl) ? "active text-[#4338CA]" : ""}`}
                            data-testid="nav-dashboard-link"
                        >
                            Painel
                        </Link>
                    )}
                </nav>

                <div className="hidden md:flex items-center gap-3">
                    {!user ? (
                        <>
                            <Link
                                to="/login"
                                className="text-sm font-semibold text-slate-700 hover:text-[#4338CA] transition-colors px-4 py-2"
                                data-testid="nav-login-link"
                            >
                                Entrar
                            </Link>
                            <Link
                                to="/register"
                                className="btn-primary text-sm px-5 py-2.5"
                                data-testid="nav-register-link"
                            >
                                Criar conta
                            </Link>
                        </>
                    ) : (
                        <DropdownMenu>
                            <DropdownMenuTrigger
                                className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 hover:border-[#4338CA] hover:bg-slate-50 transition-all outline-none"
                                data-testid="user-menu-trigger"
                            >
                                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#4338CA] to-[#FF5A5F] flex items-center justify-center text-white font-bold text-sm">
                                    {user.name?.charAt(0).toUpperCase()}
                                </div>
                                <div className="text-left">
                                    <div className="text-sm font-semibold text-slate-900 leading-tight">
                                        {user.name}
                                    </div>
                                    <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                                        {user.role === "provider" ? "Prestador" : "Cliente"}
                                    </div>
                                </div>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56">
                                <DropdownMenuLabel>{user.email}</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    onClick={() => nav(dashUrl)}
                                    data-testid="menu-dashboard-item"
                                >
                                    <LayoutDashboard className="w-4 h-4 mr-2" />
                                    Meu Painel
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() => nav("/services")}
                                    data-testid="menu-services-item"
                                >
                                    <User className="w-4 h-4 mr-2" />
                                    Catálogo de Serviços
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    onClick={handleLogout}
                                    className="text-red-600 focus:text-red-600 cursor-pointer"
                                    data-testid="menu-logout-item"
                                >
                                    <LogOut className="w-4 h-4 mr-2" />
                                    Sair
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                </div>

                <button
                    className="md:hidden p-2 text-slate-600"
                    onClick={() => setOpen(!open)}
                    data-testid="mobile-menu-toggle"
                    aria-label="Toggle menu"
                >
                    {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
            </div>

            {open && (
                <div className="md:hidden border-t border-slate-200 bg-white">
                    <div className="px-6 py-4 flex flex-col gap-3">
                        <Link
                            to="/services"
                            onClick={() => setOpen(false)}
                            className="text-slate-700 hover:text-[#4338CA]"
                        >
                            Serviços
                        </Link>
                        {user ? (
                            <>
                                <Link
                                    to={dashUrl}
                                    onClick={() => setOpen(false)}
                                    className="text-slate-700 hover:text-[#4338CA]"
                                >
                                    Painel
                                </Link>
                                <button
                                    onClick={handleLogout}
                                    className="text-left text-red-600"
                                >
                                    Sair
                                </button>
                            </>
                        ) : (
                            <>
                                <Link
                                    to="/login"
                                    onClick={() => setOpen(false)}
                                    className="text-slate-700"
                                >
                                    Entrar
                                </Link>
                                <Link
                                    to="/register"
                                    onClick={() => setOpen(false)}
                                    className="btn-primary text-center"
                                >
                                    Criar conta
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            )}
        </header>
    );
}
