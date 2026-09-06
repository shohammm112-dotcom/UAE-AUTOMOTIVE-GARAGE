import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export const BookServicePage: React.FC = () => {
  return (
    <div className="flex flex-col min-h-[80vh] items-center justify-center bg-zinc-50 px-4 py-12">
      <div className="bg-white p-10 md:p-12 rounded-2xl border border-zinc-200 shadow-sm text-center max-w-xl w-full">
        <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertCircle className="w-8 h-8 text-blue-600" />
        </div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight mb-4">Online Booking</h1>
        
        <div className="text-left mb-8 space-y-4 text-zinc-600">
          <p>
            Currently, our online appointment booking system is available exclusively to registered customers through the Customer Portal.
          </p>
          <div className="p-4 bg-zinc-50 border border-zinc-100 rounded-lg text-sm">
            <strong>API GAP NOTE:</strong> Inspecting the backend routes (<code>/api/v1/appointments</code>) reveals that the current API architecture enforces <code>createAuthMiddleware</code> on all appointment creation routes. There is no unauthenticated public booking endpoint. Bypassing this security requirement is prohibited in Step 4.2.
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <Link to="/login">
            <Button className="w-full text-base h-12">
              Log In to Book Service
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
          <Link to="/request-quote">
            <Button variant="outline" className="w-full text-base h-12">
              Request a Quote (No Login Required)
            </Button>
          </Link>
          <Link to="/contact">
            <Button variant="ghost" className="w-full text-base h-12 text-zinc-600">
              Contact us by phone
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};
