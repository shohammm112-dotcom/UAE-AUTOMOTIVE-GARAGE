import React from "react";
import { Link } from "react-router-dom";
import { Wrench, Shield, Zap, Search, ThermometerSnowflake, Cog, Activity } from "lucide-react";

export const ServicesPage: React.FC = () => {
  const services = [
    {
      id: "diagnostics",
      title: "Computer Diagnostics",
      description: "State-of-the-art diagnostic equipment to accurately identify engine, transmission, and electronic faults before they become expensive problems.",
      icon: Activity
    },
    {
      id: "mechanical",
      title: "Mechanical Repairs",
      description: "From minor component replacements to complete engine and transmission rebuilds, performed by highly trained automotive technicians.",
      icon: Wrench
    },
    {
      id: "electrical",
      title: "Auto Electrical",
      description: "Expert troubleshooting and repair of complex vehicle electrical systems, wiring harnesses, sensors, and control modules.",
      icon: Zap
    },
    {
      id: "ac",
      title: "AC Servicing & Repair",
      description: "Comprehensive air conditioning services including leak detection, compressor replacement, and system recharging for the UAE climate.",
      icon: ThermometerSnowflake
    },
    {
      id: "brakes",
      title: "Brake Systems",
      description: "Complete brake system maintenance including pad and rotor replacement, fluid flushes, and ABS module diagnostics.",
      icon: Shield
    },
    {
      id: "maintenance",
      title: "Preventative Maintenance",
      description: "Factory-scheduled maintenance, oil changes, fluid flushes, and comprehensive vehicle inspections to keep your car running smoothly.",
      icon: Cog
    },
    {
      id: "inspection",
      title: "Pre-Purchase Inspection",
      description: "Thorough bumper-to-bumper inspections and reporting to give you peace of mind before buying a used vehicle.",
      icon: Search
    }
  ];

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Page Header */}
      <section className="bg-zinc-50 border-b border-zinc-200 py-20 md:py-32">
        <div className="container mx-auto px-4 text-center max-w-3xl">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-zinc-950 mb-6">Our Services</h1>
          <p className="text-lg text-zinc-600 leading-relaxed">
            Comprehensive automotive care delivered with precision and transparency. We handle everything from routine maintenance to complex mechanical repairs.
          </p>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-20 md:py-32">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service) => (
              <div key={service.id} className="p-8 rounded-2xl border border-zinc-200 hover:border-zinc-300 hover:shadow-sm transition-all bg-white group">
                <div className="w-14 h-14 bg-zinc-100 rounded-xl flex items-center justify-center mb-6 group-hover:bg-zinc-900 group-hover:text-white transition-colors text-zinc-900">
                  <service.icon className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold text-zinc-950 mb-3">{service.title}</h3>
                <p className="text-zinc-600 leading-relaxed text-sm">
                  {service.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Process Banner */}
      <section className="bg-zinc-950 text-white py-20">
        <div className="container mx-auto px-4 max-w-5xl text-center">
          <h2 className="text-3xl font-bold tracking-tight mb-12">The Digital Service Process</h2>
          <div className="grid md:grid-cols-4 gap-8 relative">
            {/* Connecting Line (Desktop) */}
            <div className="hidden md:block absolute top-1/2 left-0 w-full h-0.5 bg-zinc-800 -translate-y-1/2 z-0"></div>
            
            {[
              { step: "01", title: "Intake & Inspect", desc: "Digital check-in and comprehensive photo-documented inspection." },
              { step: "02", title: "Digital Estimate", desc: "Receive a transparent, itemized quote directly to your phone." },
              { step: "03", title: "Instant Approval", desc: "Approve the work you want done with a single tap." },
              { step: "04", title: "Track Repair", desc: "Monitor live progress until your vehicle is ready." },
            ].map((item, i) => (
              <div key={i} className="relative z-10 bg-zinc-950 p-4">
                <div className="w-12 h-12 mx-auto bg-zinc-800 rounded-full flex items-center justify-center font-bold text-lg mb-4 border-4 border-zinc-950">
                  {item.step}
                </div>
                <h4 className="font-bold mb-2">{item.title}</h4>
                <p className="text-sm text-zinc-400">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* CTA */}
      <section className="py-24 bg-white text-center">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold tracking-tight mb-6">Need a service not listed here?</h2>
          <p className="text-zinc-600 mb-8 max-w-xl mx-auto">
            Our expert technicians can handle almost any automotive issue. Contact us to discuss your specific requirements.
          </p>
          <div className="flex justify-center gap-4">
            <Link to="/contact" className="h-12 px-8 inline-flex items-center justify-center rounded-md bg-zinc-900 text-white font-semibold hover:bg-zinc-800 transition-colors">
              Contact Us
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};
