import React from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, ChevronRight, Activity, FileCheck, History, Wrench, Shield, Clock } from "lucide-react";

export const HomePage: React.FC = () => {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-zinc-950 text-white min-h-[75vh] flex flex-col justify-center border-b border-zinc-800">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '40px 40px' }}></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl h-96 bg-zinc-800/30 blur-[120px] rounded-full pointer-events-none"></div>
        
        <div className="container relative z-10 mx-auto px-4 py-24 md:py-32 flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-900 border border-zinc-800 text-sm font-medium text-zinc-300 mb-8">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            UAE's Fully Digitized Workshop
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight max-w-4xl leading-tight mb-6">
            Precision Engineering.<br className="hidden md:block"/> Digital Transparency.
          </h1>
          <p className="text-lg md:text-xl text-zinc-400 max-w-2xl mb-10 leading-relaxed">
            The UAE's first fully digitized automotive service experience. Track repairs in real-time, approve estimates instantly, and manage your garage digitally.
          </p>
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <Link to="/request-quote" className="h-12 px-8 inline-flex items-center justify-center rounded-md bg-white text-zinc-950 font-semibold hover:bg-zinc-200 transition-colors gap-2">
              Request a Quote
              <ChevronRight className="w-4 h-4" />
            </Link>
            <Link to="/login" className="h-12 px-8 inline-flex items-center justify-center rounded-md border border-zinc-700 bg-transparent text-white font-semibold hover:bg-zinc-800 transition-colors">
              Access Customer Portal
            </Link>
          </div>
        </div>
      </section>

      {/* Services Overview */}
      <section className="py-24 bg-white text-zinc-950">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-bold tracking-tight mb-4">Premium Automotive Care</h2>
            <p className="text-zinc-500">Comprehensive diagnostic, repair, and maintenance services for luxury and daily driven vehicles across the UAE.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {[
              { title: "Diagnostics", desc: "Advanced computer diagnostics and fault finding.", icon: Activity },
              { title: "Mechanical", desc: "Engine, transmission, and drivetrain repairs.", icon: Wrench },
              { title: "Electrical", desc: "Complex wiring, sensor, and module repairs.", icon: Shield },
              { title: "Maintenance", desc: "Routine servicing, fluid changes, and filters.", icon: Clock },
            ].map((service, i) => (
              <div key={i} className="p-6 rounded-xl border border-zinc-200 bg-zinc-50/50 hover:bg-zinc-50 transition-colors group">
                <div className="w-12 h-12 bg-white rounded-lg border border-zinc-200 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <service.icon className="w-6 h-6 text-zinc-950" />
                </div>
                <h3 className="text-lg font-bold mb-2">{service.title}</h3>
                <p className="text-sm text-zinc-600 leading-relaxed mb-4">{service.desc}</p>
                <Link to="/services" className="text-sm font-semibold text-zinc-950 inline-flex items-center gap-1 hover:gap-2 transition-all">
                  Learn more <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Digital Transparency */}
      <section className="py-24 bg-zinc-50">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-16 items-center max-w-6xl mx-auto">
            <div>
              <h2 className="text-3xl font-bold tracking-tight mb-6">Complete Digital Transparency</h2>
              <p className="text-lg text-zinc-600 mb-8 leading-relaxed">
                We believe you should never be surprised by a repair bill or left wondering about the status of your vehicle. Our custom digital portal gives you total control.
              </p>
              
              <div className="space-y-6">
                {[
                  { title: "Real-Time Tracking", desc: "Follow your vehicle's journey through our workshop stages.", icon: Activity },
                  { title: "Digital Approvals", desc: "Review detailed, itemized repair estimates and approve work instantly.", icon: FileCheck },
                  { title: "Complete History", desc: "Access your complete service history, invoices, and reports anytime.", icon: History },
                ].map((feature, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="mt-1">
                      <div className="w-10 h-10 rounded-full bg-zinc-900 text-white flex items-center justify-center">
                        <feature.icon className="w-5 h-5" />
                      </div>
                    </div>
                    <div>
                      <h4 className="text-lg font-bold mb-1">{feature.title}</h4>
                      <p className="text-zinc-600 text-sm leading-relaxed">{feature.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-10">
                <Link to="/login" className="h-12 px-8 inline-flex items-center justify-center rounded-md bg-zinc-900 text-white font-semibold hover:bg-zinc-800 transition-colors">
                  Explore the Portal
                </Link>
              </div>
            </div>
            
            <div className="relative">
              {/* Abstract Portal UI Mockup */}
              <div className="bg-white rounded-2xl border border-zinc-200 shadow-xl overflow-hidden">
                <div className="h-12 border-b border-zinc-100 bg-zinc-50/50 flex items-center px-4 gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-400"></div>
                  <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                  <div className="w-3 h-3 rounded-full bg-green-400"></div>
                </div>
                <div className="p-8 space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-lg">Toyota Land Cruiser</h3>
                      <p className="text-sm text-zinc-500">Job #WK-2024-089</p>
                    </div>
                    <span className="px-3 py-1 bg-amber-100 text-amber-800 text-xs font-bold rounded-full uppercase tracking-wider">In Progress</span>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="h-2 w-full bg-zinc-100 rounded-full overflow-hidden">
                      <div className="h-full bg-zinc-900 w-3/5"></div>
                    </div>
                    <div className="flex justify-between text-xs font-medium text-zinc-500">
                      <span>Received</span>
                      <span>Inspecting</span>
                      <span className="text-zinc-900">Repairing</span>
                      <span>Ready</span>
                    </div>
                  </div>
                  
                  <div className="pt-6 border-t border-zinc-100 space-y-4">
                    <div className="flex justify-between items-center p-4 rounded-xl border border-zinc-100">
                      <div className="flex items-center gap-3">
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                        <span className="font-medium text-sm">Brake Pad Replacement</span>
                      </div>
                      <span className="text-sm font-bold">Approved</span>
                    </div>
                    <div className="flex justify-between items-center p-4 rounded-xl border border-zinc-100">
                      <div className="flex items-center gap-3">
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                        <span className="font-medium text-sm">Oil Change (Synthetic)</span>
                      </div>
                      <span className="text-sm font-bold">Approved</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-zinc-900 text-white text-center">
        <div className="container mx-auto px-4 max-w-3xl">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-6">Ready to experience the future of auto repair?</h2>
          <p className="text-lg text-zinc-400 mb-10">
            Book an appointment or request a quote today. Our team is ready to provide transparent, high-quality service for your vehicle.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link to="/request-quote" className="h-12 px-8 inline-flex items-center justify-center rounded-md bg-white text-zinc-950 font-semibold hover:bg-zinc-200 transition-colors">
              Request a Quote
            </Link>
            <Link to="/contact" className="h-12 px-8 inline-flex items-center justify-center rounded-md border border-zinc-700 bg-transparent text-white font-semibold hover:bg-zinc-800 transition-colors">
              Contact Us
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};
