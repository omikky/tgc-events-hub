import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Booking from "./pages/Booking";
import Dashboard from "./pages/Dashboard";
import AdminDashboard from "./pages/AdminDashboard";
import ClientsList from "./pages/admin/ClientsList";
import ClientDetails from "./pages/admin/ClientDetails";
import NotFound from "./pages/NotFound";
import BankSettings from "./pages/admin/BankSettings";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./pages/bot/ProtectedRoute";
import BotLanding from "./pages/bot/Landing";
import BotLogin from "./pages/bot/Login";
import BotRegister from "./pages/bot/Register";
import BotDashboard from "./pages/bot/Dashboard";
import BotAdmin from "./pages/bot/Admin";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Events hub */}
            <Route path="/" element={<Index />} />
            <Route path="/booking" element={<Booking />} />
            <Route path="/mybookings" element={<Dashboard />} />
            <Route path="/admin-dashboard" element={<AdminDashboard />} />
            <Route path="/admin/clients" element={<ClientsList />} />
            <Route path="/admin/clients/:email" element={<ClientDetails />} />
            <Route path="/admin/settings/bank" element={<BankSettings />} />

            {/* Trading bot subscription platform */}
            <Route path="/bot" element={<BotLanding />} />
            <Route path="/bot/login" element={<BotLogin />} />
            <Route path="/bot/register" element={<BotRegister />} />
            <Route
              path="/bot/dashboard"
              element={
                <ProtectedRoute>
                  <BotDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/bot/admin"
              element={
                <ProtectedRoute adminOnly>
                  <BotAdmin />
                </ProtectedRoute>
              }
            />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
