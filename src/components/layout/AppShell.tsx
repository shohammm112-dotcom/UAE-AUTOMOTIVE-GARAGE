import React from "react";
import { Outlet, Link, useLocation, Navigate } from "react-router-dom";
import { 
  CarFront, 
  LayoutDashboard, 
  FileText, 
  Wrench, 
  LogOut, 
  Bell, 
  Calendar,
  Receipt,
  History
} from "lucide-react";
import { useAuth } from "@/lib/auth/AuthProvider";
import { cn } from "@/lib/utils";
import { useApi } from "@/lib/api/hooks";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/portal" },
  { icon: CarFront, label: "Vehicles", href: "/portal/vehicles" },
  { icon: Calendar, label: "Appointments", href: "/portal/appointments" },
  { icon: Wrench, label: "Active Jobs", href: "/portal/jobs" },
  { icon: FileText, label: "Estimates", href: "/portal/estimates" },
  { icon: Receipt, label: "Invoices", href: "/portal/invoices" },
  { icon: History, label: "Service History", href: "/portal/history" },
];

export const AppShell: React.FC = () => {
  const { isAuthenticated, isLoading, logout, user } = useAuth();
  const location = useLocation();
  const { data: notificationsData } = useApi<{ notifications: any[] }>("/notifications");

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-900"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const unreadCount = notificationsData?.notifications?.filter(n => !n.read).length || 0;

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col md:flex-row font-sans text-zinc-950">
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 border-r border-zinc-200 bg-white flex-shrink-0 flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-zinc-200">
          <Link to="/portal" className="flex items-center gap-2 font-bold tracking-tight">
            <Wrench className="w-5 h-5 text-zinc-900" />
            <span>UAE Garage Portal</span>
          </Link>
        </div>
        
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.href || (item.href !== "/portal" && location.pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  isActive 
                    ? "bg-zinc-100 text-zinc-900" 
                    : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50"
                )}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-zinc-200">
          <Link to="/portal/profile" className="flex items-center gap-3 px-3 py-2 mb-4 hover:bg-zinc-50 rounded-md transition-colors">
            <div className="w-8 h-8 rounded-full bg-zinc-200 flex items-center justify-center text-xs font-bold uppercase text-zinc-600">
              {user?.customer?.fullName.charAt(0) || "U"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate text-zinc-900">{user?.customer?.fullName}</p>
              <p className="text-xs text-zinc-500 truncate">{user?.customer?.email}</p>
            </div>
          </Link>
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 flex items-center justify-end px-6 border-b border-zinc-200 bg-white sticky top-0 z-10">
          <Link to="/portal/notifications" className="relative p-2 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-full transition-colors">
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full"></span>
            )}
          </Link>
        </header>

        <main className="flex-1 p-6 md:p-8 overflow-y-auto">
          <div className="max-w-5xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
