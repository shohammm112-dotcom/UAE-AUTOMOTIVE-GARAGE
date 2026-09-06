import React, { useState } from "react";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const RequestQuotePage: React.FC = () => {
  const [formState, setFormState] = useState<"idle" | "error">("idle");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormState("error");
  };

  if (formState === "error") {
    return (
      <div className="flex flex-col min-h-[80vh] items-center justify-center bg-zinc-50 px-4">
        <div className="bg-white p-12 rounded-2xl border border-zinc-200 shadow-sm text-center max-w-lg w-full">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-2xl">🚧</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight mb-4">Quote Requests Not Connected</h2>
          <p className="text-zinc-600 mb-8 leading-relaxed">
            This form is ready for the future backend integration. Your information has NOT been submitted.
          </p>
          <Button onClick={() => setFormState("idle")} variant="outline" className="w-full">
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-zinc-50 py-12 md:py-20">
      <div className="container mx-auto px-4 max-w-3xl">
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-zinc-950 mb-4">Request a Quote</h1>
          <p className="text-lg text-zinc-600">Provide details about your vehicle and the service required. We'll get back to you with an estimate.</p>
        </div>
        
        <div className="bg-white p-8 md:p-10 rounded-2xl border border-zinc-200 shadow-sm">

          {/* API GAP NOTE: Forms currently do not post to a backend route */}
          <form onSubmit={handleSubmit} className="space-y-8">
            
            {/* Section 1: Vehicle Info */}
            <div className="space-y-6">
              <h3 className="text-lg font-bold border-b border-zinc-100 pb-2">Vehicle Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="make">Make</Label>
                  <Input id="make" placeholder="e.g. Toyota" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="model">Model</Label>
                  <Input id="model" placeholder="e.g. Land Cruiser" required />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="year">Year</Label>
                  <Input id="year" type="number" placeholder="2022" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vin">VIN (Optional)</Label>
                  <Input id="vin" placeholder="17-character VIN" />
                </div>
              </div>
            </div>

            {/* Section 2: Service Details */}
            <div className="space-y-6">
              <h3 className="text-lg font-bold border-b border-zinc-100 pb-2">Service Details</h3>
              
              <div className="space-y-2">
                <Label htmlFor="serviceType">Primary Service Needed</Label>
                <select 
                  id="serviceType"
                  className="flex h-10 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-2 disabled:opacity-50"
                  required
                >
                  <option value="">Select a service category</option>
                  <option value="routine_maintenance">Routine Maintenance / Oil Change</option>
                  <option value="diagnostics">Warning Light / Diagnostics</option>
                  <option value="brakes">Brakes</option>
                  <option value="ac">A/C System</option>
                  <option value="mechanical">Mechanical Repair</option>
                  <option value="electrical">Electrical Issue</option>
                  <option value="other">Other / Not Sure</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Please describe the issue or requested work</Label>
                <textarea 
                  id="description"
                  className="flex min-h-[120px] w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm ring-offset-background placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-2 resize-y disabled:opacity-50"
                  placeholder="Details help us provide a more accurate quote..."
                  required
                ></textarea>
              </div>
            </div>

            {/* Section 3: Contact Info */}
            <div className="space-y-6">
              <h3 className="text-lg font-bold border-b border-zinc-100 pb-2">Your Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input id="fullName" placeholder="Ahmed Al Mansoori" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input id="phone" type="tel" placeholder="+971 50 123 4567" required />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input id="email" type="email" placeholder="ahmed@example.com" required />
              </div>
            </div>

            <div className="pt-4">
              <Button type="submit" className="w-full text-base h-12" disabled>
                  <>
                    Request Quote
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
              </Button>
              <p className="text-xs text-center text-zinc-500 mt-4">
                By submitting this request, you agree to our privacy policy and consent to being contacted regarding your vehicle service.
              </p>
            </div>
            
          </form>
        </div>
      </div>
    </div>
  );
};
