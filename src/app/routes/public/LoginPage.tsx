import React, { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Lock, ArrowRight, ShieldCheck, FileCheck, History } from "lucide-react";
import { useAuth } from "@/lib/auth/AuthProvider";

export const LoginPage: React.FC = () => {
  const { loginWithMockDevToken, isLoading, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/portal", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  return (
    <div className="flex flex-col md:flex-row min-h-[calc(100vh-80px)]">
      {/* Left side - Value Proposition */}
      <div className="w-full md:w-1/2 bg-zinc-950 text-white p-8 md:p-16 lg:p-24 flex flex-col justify-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '40px 40px' }}></div>
        
        <div className="relative z-10 max-w-lg">
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-6">Welcome to your digital garage.</h1>
          <p className="text-zinc-400 text-lg mb-12">
            The UAE Auto Garage customer portal provides unprecedented transparency into your vehicle's service journey.
          </p>
          
          <div className="space-y-8">
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0">
                <FileCheck className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold mb-1">Digital Approvals</h3>
                <p className="text-sm text-zinc-400">Review itemized estimates and approve work instantly from your device.</p>
              </div>
            </div>
            
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0">
                <History className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold mb-1">Service History</h3>
                <p className="text-sm text-zinc-400">Access past invoices, diagnostic reports, and maintenance records anytime.</p>
              </div>
            </div>
            
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold mb-1">Secure & Private</h3>
                <p className="text-sm text-zinc-400">Your vehicle data and personal information are protected by enterprise-grade security.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Right side - Login Form */}
      <div className="w-full md:w-1/2 bg-white p-8 md:p-16 flex flex-col justify-center items-center">
        <div className="w-full max-w-md">
          <div className="text-center mb-10">
            <div className="w-16 h-16 bg-zinc-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Lock className="w-8 h-8 text-zinc-900" />
            </div>
            <h2 className="text-3xl font-bold tracking-tight mb-2">Sign In</h2>
            <p className="text-zinc-500">Access your customer portal</p>
          </div>

          <div className="p-6 bg-blue-50 border border-blue-100 rounded-xl mb-8">
            <h4 className="font-semibold text-blue-900 mb-2">Development Mode</h4>
            <p className="text-sm text-blue-800 mb-4">
              Live authentication (Firebase/Supabase) is deferred to the Antigravity phase. Click below to enter the portal using a verified mock customer session.
            </p>
            <button
              onClick={loginWithMockDevToken}
              disabled={isLoading}
              className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-md transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isLoading ? "Authenticating..." : "Login as Mock Customer"}
              {!isLoading && <ArrowRight className="w-4 h-4" />}
            </button>
          </div>
          
          <div className="text-center">
            <p className="text-sm text-zinc-500">
              Don't have an account? <Link to="/contact" className="font-semibold text-zinc-900 hover:underline">Contact us</Link> to register your vehicle.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
