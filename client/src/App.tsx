import { Route, Switch } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient-simple";
import Home from "./pages/Home.tsx";
import AdminDashboard from "./pages/AdminDashboard.tsx";
import TrackingPage from "./pages/TrackingPage";
import CustomerTrackingPage from "./pages/CustomerTrackingPage";
import CustomerLogin from "./pages/auth/customer-login";
import CustomerDashboard from "./pages/customer/dashboard";

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-700 to-blue-500">
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/customers" component={CustomerLogin} />
          <Route path="/customer/dashboard" component={CustomerDashboard} />
          <Route path="/drivers" component={() => <div className="min-h-screen flex items-center justify-center text-white"><h1 className="text-2xl">Portal de Repartidores - En desarrollo</h1></div>} />
          <Route path="/admin" component={AdminDashboard} />
          <Route path="/track/:trackingCode/:trackingToken" component={CustomerTrackingPage} />
          <Route path="/tracking-admin/:trackingCode/:trackingToken" component={TrackingPage} />
          <Route>
            <div className="min-h-screen flex items-center justify-center text-white">
              <h1 className="text-2xl">Página no encontrada</h1>
            </div>
          </Route>
        </Switch>
        <Toaster />
      </div>
    </QueryClientProvider>
  );
}

export default App;