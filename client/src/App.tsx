import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import Landing from "@/pages/landing";
import AdminDashboard from "@/pages/admin/dashboard";
import AdminInventory from "@/pages/admin/inventory";
import AdminCustomers from "@/pages/admin/customers";
import AdminDeliveries from "@/pages/admin/deliveries";
import AdminReports from "@/pages/admin/reports";
import UserManagement from "@/pages/admin/user-management";
import DriverDashboard from "@/pages/driver/dashboard";
import CustomerDashboard from "@/pages/customer/dashboard";
import NotFound from "@/pages/not-found";

function Router() {
  const { isAuthenticated, isLoading, user } = useAuth();

  // Debug logging
  console.log("Auth state:", { isAuthenticated, isLoading, user, userRole: user?.role });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-blue"></div>
      </div>
    );
  }

  return (
    <Switch>
      {!isAuthenticated ? (
        <Route path="/" component={Landing} />
      ) : (
        <>
          {/* Admin routes */}
          {user?.role === 'admin' && (
            <>
              <Route path="/" component={AdminDashboard} />
              <Route path="/admin/dashboard" component={AdminDashboard} />
              <Route path="/admin/inventory" component={AdminInventory} />
              <Route path="/admin/customers" component={AdminCustomers} />
              <Route path="/admin/deliveries" component={AdminDeliveries} />
              <Route path="/admin/reports" component={AdminReports} />
              <Route path="/admin/users" component={UserManagement} />
            </>
          )}
          
          {/* Driver routes */}
          {user?.role === 'driver' && (
            <>
              <Route path="/" component={DriverDashboard} />
              <Route path="/driver/dashboard" component={DriverDashboard} />
            </>
          )}
          
          {/* Customer routes */}
          {user?.role === 'customer' && (
            <>
              <Route path="/" component={CustomerDashboard} />
              <Route path="/customer/dashboard" component={CustomerDashboard} />
            </>
          )}
          
          {/* Default fallback based on role */}
          {user && (
            <>
              {user.role === 'admin' && <Route path="/*" component={AdminDashboard} />}
              {user.role === 'driver' && <Route path="/*" component={DriverDashboard} />}
              {user.role === 'customer' && <Route path="/*" component={CustomerDashboard} />}
            </>
          )}
        </>
      )}
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
