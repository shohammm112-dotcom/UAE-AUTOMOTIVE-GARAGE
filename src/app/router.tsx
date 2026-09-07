import { createBrowserRouter, Navigate, Link } from "react-router-dom";
import { PublicShell } from "@/components/layout/PublicShell";
import { AppShell } from "@/components/layout/AppShell";
import { StaffShell } from "@/components/layout/StaffShell";

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

// Staff Pages
import { StaffDashboardPage } from "./routes/staff/StaffDashboardPage";
import { StaffJobsPage } from "./routes/staff/StaffJobsPage";
import { StaffCustomersPage } from "./routes/staff/StaffCustomersPage";
import { StaffCustomerDetailPage } from "./routes/staff/StaffCustomerDetailPage";
import { StaffVehicleDetailPage } from "./routes/staff/StaffVehicleDetailPage";
import { StaffJobDetailPage } from "./routes/staff/StaffJobDetailPage";
import { StaffEstimatesPage } from "./routes/staff/StaffEstimatesPage";
import { StaffEstimateCreatePage } from "./routes/staff/StaffEstimateCreatePage";
import { StaffEstimateDetailPage } from "./routes/staff/StaffEstimateDetailPage";
import { StaffInvoicesPage } from "./routes/staff/StaffInvoicesPage";
import { StaffInvoiceCreatePage } from "./routes/staff/StaffInvoiceCreatePage";
import { StaffInvoiceDetailPage } from "./routes/staff/StaffInvoiceDetailPage";
import { StaffAppointmentsPage } from "./routes/staff/StaffAppointmentsPage";

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
    path: "/staff",
    element: <StaffShell />,
    children: [
      { index: true, element: <Navigate to="/staff/dashboard" replace /> },
      { path: "dashboard", element: <StaffDashboardPage /> },
      { path: "appointments", element: <StaffAppointmentsPage /> },
      { path: "customers", element: <StaffCustomersPage /> },
      { path: "customers/:id", element: <StaffCustomerDetailPage /> },
      { path: "vehicles/:id", element: <StaffVehicleDetailPage /> },
      { path: "jobs", element: <StaffJobsPage /> },
      { path: "jobs/:id", element: <StaffJobDetailPage /> },
      { path: "estimates", element: <StaffEstimatesPage /> },
      { path: "estimates/new", element: <StaffEstimateCreatePage /> },
      { path: "estimates/:id", element: <StaffEstimateDetailPage /> },
      { path: "invoices", element: <StaffInvoicesPage /> },
      { path: "invoices/new", element: <StaffInvoiceCreatePage /> },
      { path: "invoices/:id", element: <StaffInvoiceDetailPage /> },
    ],
  },
  {
    path: "*",
    element: <Navigate to="/" replace />,
  }
]);


