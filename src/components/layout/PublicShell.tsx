import React, { useState } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import { Wrench, Phone, Mail, MapPin, ArrowRight, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

export const PublicShell: React.FC = () => {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navLinks = [
    { name: "Services", href: "/services" },
    { name: "About", href: "/about" },
    { name: "Contact", href: "/contact" },
  ];

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  return (
    <div className="min-h-screen bg-zinc-50 font-sans text-zinc-950 flex flex-col">
      <header className="sticky top-0 z-50 w-full border-b border-zinc-200 bg-white/90 backdrop-blur-md">
        <div className="container mx-auto px-4 h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group z-50 relative" onClick={closeMobileMenu}>
            <div className="w-10 h-10 bg-zinc-950 rounded-lg flex items-center justify-center group-hover:bg-zinc-800 transition-colors">
              <Wrench className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-lg tracking-tight leading-none">Auto Garage</span>
              <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-500">Premium UAE Service</span>
            </div>
          </Link>
          
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link 
                key={link.name}
                to={link.href} 
                className={cn(
                  "text-sm font-medium transition-colors hover:text-zinc-950",
                  location.pathname === link.href ? "text-zinc-950" : "text-zinc-500"
                )}
              >
                {link.name}
              </Link>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-4">
            <Link 
              to="/request-quote" 
              className="text-sm font-medium text-zinc-950 hover:text-zinc-700 transition-colors"
            >
              Request Quote
            </Link>
            <Link 
              to="/login" 
              className="text-sm font-semibold bg-zinc-950 text-white px-5 py-2.5 rounded-md hover:bg-zinc-800 transition-colors shadow-sm flex items-center gap-2"
            >
              Customer Portal
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <button 
            className="md:hidden p-2 text-zinc-600 hover:text-zinc-950 z-50 relative"
            onClick={toggleMobileMenu}
            aria-label="Toggle mobile menu"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-40 bg-white flex flex-col pt-24 px-6 md:hidden">
            <nav className="flex flex-col gap-6 text-xl font-semibold">
              {navLinks.map((link) => (
                <Link 
                  key={link.name}
                  to={link.href} 
                  onClick={closeMobileMenu}
                  className="border-b border-zinc-100 pb-4"
                >
                  {link.name}
                </Link>
              ))}
              <Link 
                to="/request-quote" 
                onClick={closeMobileMenu}
                className="border-b border-zinc-100 pb-4"
              >
                Request Quote
              </Link>
            </nav>
            <div className="mt-8 flex flex-col gap-4">
              <Link 
                to="/login" 
                onClick={closeMobileMenu}
                className="w-full text-center text-base font-semibold bg-zinc-950 text-white px-5 py-3.5 rounded-md hover:bg-zinc-800 transition-colors shadow-sm flex items-center justify-center gap-2"
              >
                Customer Portal
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="bg-zinc-950 text-zinc-400 py-16 mt-auto">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            <div className="space-y-4">
              <Link to="/" className="flex items-center gap-2">
                <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                  <Wrench className="w-4 h-4 text-zinc-950" />
                </div>
                <span className="font-bold text-white tracking-tight">Auto Garage</span>
              </Link>
              <p className="text-sm leading-relaxed max-w-xs">
                The UAE's first fully digitized premium automotive service experience.
              </p>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/services" className="hover:text-white transition-colors">Services</Link></li>
                <li><Link to="/about" className="hover:text-white transition-colors">About Us</Link></li>
                <li><Link to="/contact" className="hover:text-white transition-colors">Contact</Link></li>
                <li><Link to="/book-service" className="hover:text-white transition-colors">Book Service</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">Customer Access</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/login" className="hover:text-white transition-colors">Customer Portal</Link></li>
                <li><Link to="/request-quote" className="hover:text-white transition-colors">Request a Quote</Link></li>
                <li><Link to="/login" className="hover:text-white transition-colors">Track Repair</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">Contact Us</h4>
              <ul className="space-y-3 text-sm">
                <li className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>123 Industrial Area 4<br/>Al Quoz, Dubai, UAE<br/>(Placeholder)</span>
                </li>
                <li className="flex items-center gap-3">
                  <Phone className="w-4 h-4 shrink-0" />
                  <span>+971 4 123 4567</span>
                </li>
                <li className="flex items-center gap-3">
                  <Mail className="w-4 h-4 shrink-0" />
                  <span>service@autogarage.ae</span>
                </li>
              </ul>
            </div>
          </div>
          
          <div className="pt-8 border-t border-zinc-800 text-sm flex flex-col md:flex-row items-center justify-between gap-4">
            <p>© {new Date().getFullYear()} UAE Auto Garage. All rights reserved.</p>
            <div className="flex gap-6">
              <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

