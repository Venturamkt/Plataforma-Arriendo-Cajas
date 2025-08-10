import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Users, ShieldCheck, Clock } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-red-50 dark:from-blue-950 dark:to-red-950">
      {/* Hero Section */}
      <div className="relative min-h-[80vh] flex items-center justify-center bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800">
        <div className="container mx-auto px-4 py-16 text-center text-white">
          <div className="mb-8">
            <img 
              src="/logo.png" 
              alt="Arriendo Cajas" 
              className="h-24 w-auto mx-auto mb-6"
            />
            <h1 className="text-5xl md:text-7xl font-bold mb-6">
              Arriendo Cajas
            </h1>
            <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto">
              Tu solución de almacenamiento temporal. Más espacio, más orden.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-12">
            <Card className="bg-white/90 text-gray-900">
              <CardHeader className="text-center">
                <Search className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                <CardTitle>Rastrea tu Arriendo</CardTitle>
                <CardDescription>
                  Consulta el estado de tus cajas en tiempo real
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/track">
                  <Button className="w-full bg-red-600 hover:bg-red-700">
                    Rastrear Cajas
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="bg-white/90 text-gray-900">
              <CardHeader className="text-center">
                <Users className="h-12 w-12 text-red-600 mx-auto mb-4" />
                <CardTitle>Portal de Clientes</CardTitle>
                <CardDescription>
                  Accede a tu cuenta y gestiona tus arriendos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/auth/customer">
                  <Button variant="outline" className="w-full border-red-600 text-red-600 hover:bg-red-50">
                    Iniciar Sesión
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="bg-white/90 text-gray-900">
              <CardHeader className="text-center">
                <ShieldCheck className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                <CardTitle>Administración</CardTitle>
                <CardDescription>
                  Panel de control para administradores
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/auth/admin">
                  <Button variant="outline" className="w-full border-blue-600 text-blue-600 hover:bg-blue-50">
                    Admin Panel
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>

          <div className="text-center">
            <h2 className="text-3xl font-bold mb-6">¿Por qué elegir Arriendo Cajas?</h2>
            <div className="grid md:grid-cols-4 gap-6 max-w-5xl mx-auto text-center">
              <div>
                <Clock className="h-8 w-8 mx-auto mb-3 text-red-400" />
                <h3 className="font-semibold mb-2">Entrega Rápida</h3>
                <p className="text-sm opacity-90">Recibe tus cajas en 24-48 horas</p>
              </div>
              <div>
                <Search className="h-8 w-8 mx-auto mb-3 text-red-400" />
                <h3 className="font-semibold mb-2">Seguimiento Online</h3>
                <p className="text-sm opacity-90">Rastrea tus cajas en tiempo real</p>
              </div>
              <div>
                <ShieldCheck className="h-8 w-8 mx-auto mb-3 text-red-400" />
                <h3 className="font-semibold mb-2">Seguro y Confiable</h3>
                <p className="text-sm opacity-90">Garantía de $2,000 por caja</p>
              </div>
              <div>
                <Users className="h-8 w-8 mx-auto mb-3 text-red-400" />
                <h3 className="font-semibold mb-2">Soporte 24/7</h3>
                <p className="text-sm opacity-90">Atención al cliente siempre disponible</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="container mx-auto px-4 text-center">
          <div className="mb-4">
            <img 
              src="/logo.png" 
              alt="Arriendo Cajas" 
              className="h-12 w-auto mx-auto mb-4 opacity-80"
            />
          </div>
          <p className="mb-2">Arriendo Cajas - Tu solución de almacenamiento temporal</p>
          <p className="text-gray-400">¿Preguntas? Contáctanos: jalarcon@arriendocajas.cl</p>
        </div>
      </footer>
    </div>
  );
}