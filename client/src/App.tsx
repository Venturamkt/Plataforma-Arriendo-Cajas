import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import HomePage from "@/pages/home-page";
import LoginSelector from "@/pages/auth/login-selector";
import CustomerLogin from "@/pages/auth/customer-login";
import AdminLogin from "@/pages/auth/admin-login";
import DriverLogin from "@/pages/auth/driver-login";
import AdminDashboard from "@/pages/admin/dashboard";
import AdminInventory from "@/pages/admin/inventory";
import AdminCustomers from "@/pages/admin/customers-clean";
import AdminCustomersEnhanced from "@/pages/admin/customers-enhanced";

import AdminDeliveries from "@/pages/admin/deliveries";
import AdminReports from "@/pages/admin/reports";
import UserManagement from "@/pages/admin/user-management";
import CreateUser from "@/pages/admin/create-user";
import NewRental from "@/pages/admin/new-rental";
import RentalStatus from "@/pages/admin/rental-status";
import EmailPreview from "@/pages/admin/email-preview";
import Reminders from "@/pages/admin/reminders";
import BoxCodesPage from "@/pages/admin/box-codes";
import DriverDashboard from "@/pages/driver/dashboard";
import CustomerDashboard from "@/pages/customer/dashboard";
import TrackRental from "@/pages/track-rental";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      {/* Public home page */}
      <Route path="/" component={HomePage} />
      
      {/* Login selector for old route */}
      <Route path="/login" component={LoginSelector} />
      
      {/* Authentication routes */}
      <Route path="/auth/customer" component={CustomerLogin} />
      <Route path="/auth/admin" component={AdminLogin} />
      <Route path="/auth/driver" component={DriverLogin} />
      
      {/* Admin routes */}
      <Route path="/admin/dashboard" component={AdminDashboard} />
      <Route path="/admin/inventory" component={AdminInventory} />
      <Route path="/admin/customers" component={AdminCustomers} />
      <Route path="/admin/customers-new" component={AdminCustomers} />
      <Route path="/admin/customers-clean" component={AdminCustomers} />
      <Route path="/admin/customers-final" component={AdminCustomers} />
      <Route path="/admin/customers-enhanced" component={AdminCustomersEnhanced} />
      <Route path="/admin/deliveries" component={AdminDeliveries} />
      <Route path="/admin/reports" component={AdminReports} />
      <Route path="/admin/users" component={UserManagement} />
      <Route path="/admin/users/create" component={CreateUser} />
      <Route path="/admin/new-rental" component={NewRental} />
      <Route path="/admin/emails" component={EmailPreview} />
      <Route path="/admin/reminders" component={Reminders} />
      <Route path="/admin/box-codes" component={BoxCodesPage} />
      
      {/* Public tracking routes */}
      <Route path="/track" component={TrackRental} />
      <Route path="/track/:rut/:code" component={TrackRental} />
      
      {/* Driver routes */}
      <Route path="/driver/dashboard" component={DriverDashboard} />
      
      {/* Customer routes */}
      <Route path="/customer/dashboard" component={CustomerDashboard} />
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
