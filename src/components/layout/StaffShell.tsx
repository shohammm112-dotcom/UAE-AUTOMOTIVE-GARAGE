import React from "react";
import { Outlet, Link, useLocation, Navigate } from "react-router-dom";
import { 
  LayoutDashboard, 
  Wrench, 
  FileText, 
  LogOut, 
  ShieldCheck,
  Building
} from "lucide-react";
import { useAuth } from "@/lib/auth/AuthProvider";
import { cn } from "@/lib/utils";

const navItems = [
  { icon: LayoutDashboard, label: "Workshop Board", href: "/staff/dashboard" },
  { icon: Wrench, label: "Job Queue", href: "/staff/jobs" },
  { icon: FileText, label: "Estimates", href: "/staff/estimates" },
];

export const StaffShell: React.FC = () => {
  const { isAuthenticated, isLoading, logout, user } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-white">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Ensure only staff can access this section
  const isStaff = user?.roles.some(r => ['admin', 'workshop_manager', 'advisor', 'service_advisor', 'technician', 'mechanic'].includes(r));
  
  if (!isStaff) {
    // If authenticated but not staff (e.g. a customer), redirect to their portal
    return <Navigate to="/portal" replace />;
  }

  const roleLabels: Record<string, string> = {
    'admin': 'Admin',
    'workshop_manager': 'Workshop Manager',
    'advisor': 'Service Advisor',
    'service_advisor': 'Service Advisor',
    'technician': 'Technician',
    'mechanic': 'Mechanic'
  };

  const primaryRole = user?.roles.find(r => roleLabels[r]) || 'Staff';
  const roleDisplay = roleLabels[primaryRole] || primaryRole;

  return (
    <div className="min-h-screen bg-zinc-100 flex flex-col md:flex-row font-sans text-zinc-950">
      {/* Sidebar Navigation - Dark themed for operational feel */}
      <aside className="w-full md:w-64 bg-zinc-950 text-zinc-300 flex-shrink-0 flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-zinc-800 bg-black">
          <Link to="/staff" className="flex items-center gap-2 font-bold tracking-tight text-white">
            <Building className="w-5 h-5" />
            <span>Garage Operations</span>
          </Link>
        </div>
        
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.href || (item.href !== "/staff" && location.pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  isActive 
                    ? "bg-zinc-800 text-white" 
                    : "hover:text-white hover:bg-zinc-900"
                )}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-zinc-800 bg-zinc-900/50">
          <div className="flex items-center gap-3 px-3 py-2 mb-4">
            <div className="w-8 h-8 rounded-full bg-blue-900 border border-blue-700 flex items-center justify-center text-xs font-bold uppercase text-white shadow-inner">
              {user?.uid?.split('_').pop()?.charAt(0) || "S"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate text-white capitalize">{user?.uid?.split('_').pop() || "Staff Member"}</p>
              <div className="flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-zinc-400" />
                <p className="text-xs text-zinc-400 truncate capitalize">{roleDisplay}</p>
              </div>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-950/30 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 flex items-center justify-between px-6 border-b border-zinc-200 bg-white sticky top-0 z-10">
          <h2 className="text-lg font-semibold text-zinc-900 tracking-tight">
            {navItems.find(i => location.pathname.startsWith(i.href))?.label || "Workshop Operations"}
          </h2>
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-100 rounded-full text-xs font-medium text-blue-800">
              <span className="w-2 h-2 rounded-full bg-green-500"></span>
              System Online
            </div>
          </div>
        </header>

        <main className="flex-1 p-6 md:p-8 overflow-y-auto">
          <div className="max-w-6xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
