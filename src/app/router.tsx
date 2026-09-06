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

// Portal Pages
import { DashboardPage } from "./routes/portal/DashboardPage";
import { VehiclesPage } from "./routes/portal/VehiclesPage";
import { JobsPage } from "./routes/portal/JobsPage";
import { JobDetailPage } from "./routes/portal/JobDetailPage";
import { AppointmentsPage } from "./routes/portal/AppointmentsPage";
import { InvoicesPage } from "./routes/portal/InvoicesPage";
import { EstimatesPage } from "./routes/portal/EstimatesPage";
import { EstimateDetailPage } from "./routes/portal/EstimateDetailPage";
import { ProfilePage } from "./routes/portal/ProfilePage";
import { NotificationsPage } from "./routes/portal/NotificationsPage";
import { ServiceHistoryPage } from "./routes/portal/ServiceHistoryPage";

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
      { index: true, element: <DashboardPage /> },
      { path: "vehicles", element: <VehiclesPage /> },
      { path: "appointments", element: <AppointmentsPage /> },
      { path: "jobs", element: <JobsPage /> },
      { path: "jobs/:id", element: <JobDetailPage /> },
      { path: "estimates", element: <EstimatesPage /> },
      { path: "estimates/:id", element: <EstimateDetailPage /> },
      { path: "invoices", element: <InvoicesPage /> },
      { path: "profile", element: <ProfilePage /> },
      { path: "notifications", element: <NotificationsPage /> },
      { path: "history", element: <ServiceHistoryPage /> },
    ],
  },
  {
    path: "*",
    element: <Navigate to="/" replace />,
  }
]);


