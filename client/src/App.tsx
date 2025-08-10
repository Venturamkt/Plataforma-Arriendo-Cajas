import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import LoginSelector from "@/pages/auth/login-selector";
import CustomerLogin from "@/pages/auth/customer-login";
import AdminLogin from "@/pages/auth/admin-login";
import DriverLogin from "@/pages/auth/driver-login";
import AdminDashboard from "@/pages/admin/dashboard";
import AdminInventory from "@/pages/admin/inventory";
import AdminCustomers from "@/pages/admin/customers";
import AdminDeliveries from "@/pages/admin/deliveries";
import AdminReports from "@/pages/admin/reports";
import UserManagement from "@/pages/admin/user-management";
import NewRental from "@/pages/admin/new-rental";
import RentalStatus from "@/pages/admin/rental-status";
import DriverDashboard from "@/pages/driver/dashboard";
import CustomerDashboard from "@/pages/customer/dashboard";
import TrackRental from "@/pages/track-rental";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      {/* Main login selector */}
      <Route path="/" component={LoginSelector} />
      
      {/* Authentication routes */}
      <Route path="/auth/customer" component={CustomerLogin} />
      <Route path="/auth/admin" component={AdminLogin} />
      <Route path="/auth/driver" component={DriverLogin} />
      
      {/* Admin routes */}
      <Route path="/admin/dashboard" component={AdminDashboard} />
      <Route path="/admin/inventory" component={AdminInventory} />
      <Route path="/admin/customers" component={AdminCustomers} />
      <Route path="/admin/deliveries" component={AdminDeliveries} />
      <Route path="/admin/reports" component={AdminReports} />
      <Route path="/admin/users" component={UserManagement} />
      <Route path="/admin/new-rental" component={NewRental} />
      <Route path="/admin/rental-status" component={RentalStatus} />
      
      {/* Public tracking route */}
      <Route path="/track" component={TrackRental} />
      
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
