import React from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";

import Landing from "@/pages/Landing";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import ServiceCatalog from "@/pages/ServiceCatalog";
import ServiceDetail from "@/pages/ServiceDetail";
import BookingFlow from "@/pages/BookingFlow";
import CustomerDashboard from "@/pages/CustomerDashboard";
import ProviderDashboard from "@/pages/ProviderDashboard";
import ProviderServices from "@/pages/ProviderServices";
import ProviderAvailability from "@/pages/ProviderAvailability";
import ProviderAppointments from "@/pages/ProviderAppointments";

function DashboardRouter() {
    const { user } = useAuth();
    if (!user) return <Navigate to="/login" replace />;
    if (user.role === "provider") return <Navigate to="/provider" replace />;
    return <Navigate to="/customer" replace />;
}

function App() {
    return (
        <div className="App">
            <AuthProvider>
                <BrowserRouter>
                    <Routes>
                        <Route path="/" element={<Landing />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/register" element={<Register />} />
                        <Route path="/services" element={<ServiceCatalog />} />
                        <Route path="/services/:id" element={<ServiceDetail />} />

                        <Route
                            path="/dashboard"
                            element={<DashboardRouter />}
                        />

                        {/* Customer routes */}
                        <Route
                            path="/customer"
                            element={
                                <ProtectedRoute role="customer">
                                    <CustomerDashboard />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/book/:serviceId"
                            element={
                                <ProtectedRoute role="customer">
                                    <BookingFlow />
                                </ProtectedRoute>
                            }
                        />

                        {/* Provider routes */}
                        <Route
                            path="/provider"
                            element={
                                <ProtectedRoute role="provider">
                                    <ProviderDashboard />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/provider/services"
                            element={
                                <ProtectedRoute role="provider">
                                    <ProviderServices />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/provider/availability"
                            element={
                                <ProtectedRoute role="provider">
                                    <ProviderAvailability />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/provider/appointments"
                            element={
                                <ProtectedRoute role="provider">
                                    <ProviderAppointments />
                                </ProtectedRoute>
                            }
                        />

                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                </BrowserRouter>
                <Toaster richColors position="top-right" />
            </AuthProvider>
        </div>
    );
}

export default App;
