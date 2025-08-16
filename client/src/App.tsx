import { Route, Switch } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Home from "./pages/Home";

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-700 to-blue-500">
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/customers" component={() => <div className="min-h-screen flex items-center justify-center text-white"><h1 className="text-2xl">Portal de Clientes - En desarrollo</h1></div>} />
          <Route path="/drivers" component={() => <div className="min-h-screen flex items-center justify-center text-white"><h1 className="text-2xl">Portal de Repartidores - En desarrollo</h1></div>} />
          <Route path="/admin" component={() => <div className="min-h-screen flex items-center justify-center text-white"><h1 className="text-2xl">Panel Administrador - En desarrollo</h1></div>} />
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