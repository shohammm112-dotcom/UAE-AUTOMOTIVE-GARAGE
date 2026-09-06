import React from "react";
import { Link } from "react-router-dom";
import { Mail, MapPin, Phone, Clock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const ContactPage: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Page Header */}
      <section className="bg-zinc-50 border-b border-zinc-200 py-16 md:py-24">
        <div className="container mx-auto px-4 text-center max-w-3xl">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-zinc-950 mb-6">Contact Us</h1>
          <p className="text-lg text-zinc-600 leading-relaxed">
            Have a question or need to schedule a service? Our team is ready to assist you with transparent, expert automotive care.
          </p>
        </div>
      </section>

      <section className="py-20 md:py-32">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="grid md:grid-cols-2 gap-16 lg:gap-24">
            
            {/* Contact Information */}
            <div>
              <h2 className="text-2xl font-bold tracking-tight mb-8">Get in Touch</h2>
              
              <div className="space-y-8 mb-12">
                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-zinc-100 rounded-lg flex items-center justify-center shrink-0">
                    <MapPin className="w-6 h-6 text-zinc-900" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-zinc-950 mb-1">Our Location</h3>
                    <p className="text-zinc-600 leading-relaxed">
                      123 Industrial Area 4<br />
                      Al Quoz, Dubai, UAE<br />
                      <span className="text-sm text-zinc-400">(Location Placeholder)</span>
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-zinc-100 rounded-lg flex items-center justify-center shrink-0">
                    <Phone className="w-6 h-6 text-zinc-900" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-zinc-950 mb-1">Phone</h3>
                    <p className="text-zinc-600">+971 4 123 4567</p>
                    <p className="text-sm text-zinc-500 mt-1">Available during business hours</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-zinc-100 rounded-lg flex items-center justify-center shrink-0">
                    <Mail className="w-6 h-6 text-zinc-900" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-zinc-950 mb-1">Email</h3>
                    <p className="text-zinc-600">service@autogarage.ae</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-zinc-100 rounded-lg flex items-center justify-center shrink-0">
                    <Clock className="w-6 h-6 text-zinc-900" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-zinc-950 mb-1">Business Hours</h3>
                    <div className="grid grid-cols-2 gap-x-8 text-zinc-600">
                      <span>Mon - Fri:</span>
                      <span>8:00 AM - 6:00 PM</span>
                      <span>Saturday:</span>
                      <span>9:00 AM - 2:00 PM</span>
                      <span>Sunday:</span>
                      <span>Closed</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-zinc-50 rounded-xl border border-zinc-200">
                <h3 className="font-bold text-lg mb-2">Ready for service?</h3>
                <p className="text-sm text-zinc-600 mb-4">Get a detailed estimate or book your next appointment entirely online.</p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Link to="/request-quote" className="inline-flex items-center justify-center px-4 py-2 bg-zinc-900 text-white rounded-md text-sm font-medium hover:bg-zinc-800 transition-colors">
                    Request Quote
                  </Link>
                  <Link to="/book-service" className="inline-flex items-center justify-center px-4 py-2 bg-white border border-zinc-200 text-zinc-900 rounded-md text-sm font-medium hover:bg-zinc-100 transition-colors">
                    Book Service
                  </Link>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className="bg-white p-8 rounded-2xl border border-zinc-200 shadow-sm">
              <h2 className="text-2xl font-bold tracking-tight mb-2">Send us a message</h2>
              <p className="text-zinc-500 mb-8 text-sm">We typically respond within 1 business day.</p>
              
              <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input id="firstName" placeholder="Ahmed" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input id="lastName" placeholder="Al Mansoori" required />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input id="email" type="email" placeholder="ahmed@example.com" required />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input id="phone" type="tel" placeholder="+971 50 123 4567" required />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject</Label>
                  <select 
                    id="subject"
                    className="flex h-10 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-2"
                    required
                  >
                    <option value="">Select a topic</option>
                    <option value="general">General Inquiry</option>
                    <option value="service">Service Question</option>
                    <option value="feedback">Feedback</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">Message</Label>
                  <textarea 
                    id="message"
                    className="flex min-h-[120px] w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm ring-offset-background placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-2 resize-y"
                    placeholder="How can we help you?"
                    required
                  ></textarea>
                </div>
                
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
                  <p className="font-semibold mb-1">Development State</p>
                  <p>Contact forms are not connected to a backend yet. Your message will NOT be sent.</p>
                </div>
                
                <Button type="submit" className="w-full text-base h-12" disabled>
                  Send Message
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </form>
            </div>
            
          </div>
        </div>
      </section>
    </div>
  );
};
