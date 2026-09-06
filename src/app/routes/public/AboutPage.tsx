import React from "react";
import { ShieldCheck, Target, Users, Wrench } from "lucide-react";

export const AboutPage: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-zinc-950 text-white py-20 md:py-32 overflow-hidden relative">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '40px 40px' }}></div>
        <div className="container mx-auto px-4 text-center max-w-4xl relative z-10">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight mb-6">Redefining Auto Repair in the UAE</h1>
          <p className="text-lg md:text-xl text-zinc-400 leading-relaxed max-w-2xl mx-auto">
            We built this garage to solve the biggest problem in automotive service: a lack of transparency. Our digital-first approach puts you entirely in control.
          </p>
        </div>
      </section>

      {/* Philosophy Section */}
      <section className="py-20 md:py-32">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div className="space-y-6">
              <h2 className="text-3xl font-bold tracking-tight">Our Philosophy</h2>
              <p className="text-lg text-zinc-600 leading-relaxed">
                For too long, getting a car repaired meant handing over the keys and hoping for the best. Hidden fees, confusing technical jargon, and surprise invoices have been the industry standard.
              </p>
              <p className="text-lg text-zinc-600 leading-relaxed">
                We believe you deserve better. By combining expert engineering with modern software, we expose the entire repair process. You see the diagnostics, you review the itemized estimates, and you approve the work digitally before a single wrench is turned.
              </p>
            </div>
            <div className="bg-zinc-100 rounded-2xl aspect-square flex items-center justify-center p-12">
               {/* Decorative placeholder for a real workshop image */}
               <div className="w-full h-full border-4 border-dashed border-zinc-300 rounded-xl flex flex-col items-center justify-center text-zinc-400 space-y-4">
                 <Wrench className="w-12 h-12" />
                 <span className="font-medium text-sm">Workshop Photography Placeholder</span>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section className="py-20 bg-zinc-50 border-y border-zinc-200">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight mb-4">What Drives Us</h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-xl border border-zinc-200 shadow-sm">
              <ShieldCheck className="w-10 h-10 text-zinc-900 mb-6" />
              <h3 className="text-xl font-bold mb-3">Total Transparency</h3>
              <p className="text-zinc-600 leading-relaxed">
                No black boxes. Our digital customer portal provides an itemized view of parts, labor, and taxes. You only pay for what you explicitly approve.
              </p>
            </div>
            
            <div className="bg-white p-8 rounded-xl border border-zinc-200 shadow-sm">
              <Target className="w-10 h-10 text-zinc-900 mb-6" />
              <h3 className="text-xl font-bold mb-3">Precision Engineering</h3>
              <p className="text-zinc-600 leading-relaxed">
                We utilize advanced OEM-level diagnostic equipment and follow factory service manuals rigorously to ensure repairs are done correctly the first time.
              </p>
            </div>
            
            <div className="bg-white p-8 rounded-xl border border-zinc-200 shadow-sm">
              <Users className="w-10 h-10 text-zinc-900 mb-6" />
              <h3 className="text-xl font-bold mb-3">Customer Empowerment</h3>
              <p className="text-zinc-600 leading-relaxed">
                We explain faults in plain language and provide photographic evidence of worn components. You make informed decisions about your vehicle's care.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
