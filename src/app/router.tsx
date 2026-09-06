import { createBrowserRouter, Navigate, Link } from "react-router-dom";
import { PublicShell } from "@/components/layout/PublicShell";
import { AppShell } from "@/components/layout/AppShell";
import { HomePage } from "./routes/public/HomePage";
import { ServicesPage } from "./routes/public/ServicesPage";
import { ContactPage } from "./routes/public/ContactPage";
import { AboutPage } from "./routes/public/AboutPage";
import { RequestQuotePage } from "./routes/public/RequestQuotePage";
import { LoginPage } from "./routes/public/LoginPage";
import { BookServicePage } from "./routes/public/BookServicePage";

// Generic placeholder for unbuilt portal pages
const GenericPortalPlaceholder = ({ title }: { title: string }) => (
  <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 border border-dashed border-zinc-200 rounded-xl bg-zinc-50/50">
    <h1 className="text-2xl font-bold tracking-tight text-zinc-900 mb-2">{title}</h1>
    <p className="text-zinc-500">To be implemented in Step 4.3 (Customer Portal).</p>
  </div>
);

const DashboardPlaceholder = () => (
  <div className="space-y-6">
    <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
    <GenericPortalPlaceholder title="Dashboard Summary" />
  </div>
);

export const router = createBrowserRouter([
  {
    path: "/",
    element: <PublicShell />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "services", element: <ServicesPage /> },
      { path: "about", element: <AboutPage /> },
      { path: "contact", element: <ContactPage /> },
      { path: "request-quote", element: <RequestQuotePage /> },
      { path: "book-service", element: <BookServicePage /> },
    ],
  },
  {
    path: "/login",
    element: <LoginPage />
  },
  {
    path: "/portal",
    element: <AppShell />,
    children: [
      { index: true, element: <DashboardPlaceholder /> },
      { path: "vehicles", element: <GenericPortalPlaceholder title="Vehicles" /> },
      { path: "appointments", element: <GenericPortalPlaceholder title="Appointments" /> },
      { path: "jobs", element: <GenericPortalPlaceholder title="Active Jobs" /> },
      { path: "estimates", element: <GenericPortalPlaceholder title="Estimates" /> },
      { path: "invoices", element: <GenericPortalPlaceholder title="Invoices" /> },
    ],
  },
  {
    path: "*",
    element: <Navigate to="/" replace />,
  }
]);


