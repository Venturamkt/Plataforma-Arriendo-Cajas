import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Users, ShieldCheck, Clock } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section with Background Image */}
      <div 
        className="relative min-h-screen flex items-center justify-center bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: "url('/abstract-blue-bg.jpg')",
          backgroundAttachment: "fixed"
        }}
      >
        {/* Dark overlay for better text readability */}
        <div className="absolute inset-0 bg-blue-900/30"></div>
        
        <div className="relative z-10 container mx-auto px-4 py-16 text-center text-white">
          <div className="mb-12">
            <img 
              src="/logo.png" 
              alt="Arriendo Cajas" 
              className="h-20 w-auto mx-auto mb-8"
            />
            <h1 className="text-6xl md:text-8xl font-bold mb-6 text-white drop-shadow-lg">
              Arriendo Cajas
            </h1>
            <p className="text-xl md:text-2xl mb-12 max-w-3xl mx-auto text-white/90">
              Tu solución de almacenamiento temporal. Más espacio, más orden.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto mb-16">
            <Card className="bg-white/95 backdrop-blur-sm text-gray-900 border-0 shadow-2xl">
              <CardHeader className="text-center pb-4">
                <Search className="h-16 w-16 text-blue-600 mx-auto mb-4" />
                <CardTitle className="text-xl font-bold">Rastrea tu Arriendo</CardTitle>
                <CardDescription className="text-gray-600">
                  Consulta el estado de tus cajas en tiempo real
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/track">
                  <Button className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3">
                    Rastrear Cajas
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="bg-white/95 backdrop-blur-sm text-gray-900 border-0 shadow-2xl">
              <CardHeader className="text-center pb-4">
                <Users className="h-16 w-16 text-red-600 mx-auto mb-4" />
                <CardTitle className="text-xl font-bold">Portal de Clientes</CardTitle>
                <CardDescription className="text-gray-600">
                  Accede a tu cuenta y gestiona tus arriendos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/auth/customer">
                  <Button variant="outline" className="w-full border-2 border-red-600 text-red-600 hover:bg-red-50 font-semibold py-3">
                    Iniciar Sesión
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="bg-white/95 backdrop-blur-sm text-gray-900 border-0 shadow-2xl">
              <CardHeader className="text-center pb-4">
                <ShieldCheck className="h-16 w-16 text-blue-600 mx-auto mb-4" />
                <CardTitle className="text-xl font-bold">Administración</CardTitle>
                <CardDescription className="text-gray-600">
                  Panel de control para administradores
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/auth/admin">
                  <Button variant="outline" className="w-full border-2 border-blue-600 text-blue-600 hover:bg-blue-50 font-semibold py-3">
                    Admin Panel
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>

          <div className="text-center">
            <h2 className="text-4xl font-bold mb-12 text-white drop-shadow-lg">¿Por qué elegir Arriendo Cajas?</h2>
            <div className="grid md:grid-cols-4 gap-8 max-w-6xl mx-auto text-center">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
                <Clock className="h-12 w-12 mx-auto mb-4 text-red-400" />
                <h3 className="font-bold mb-3 text-white text-lg">Entrega Rápida</h3>
                <p className="text-white/90">Recibe tus cajas en 24-48 horas</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
                <Search className="h-12 w-12 mx-auto mb-4 text-red-400" />
                <h3 className="font-bold mb-3 text-white text-lg">Seguimiento Online</h3>
                <p className="text-white/90">Rastrea tus cajas en tiempo real</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
                <ShieldCheck className="h-12 w-12 mx-auto mb-4 text-red-400" />
                <h3 className="font-bold mb-3 text-white text-lg">Seguro y Confiable</h3>
                <p className="text-white/90">Garantía de $2,000 por caja</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
                <Users className="h-12 w-12 mx-auto mb-4 text-red-400" />
                <h3 className="font-bold mb-3 text-white text-lg">Soporte 24/7</h3>
                <p className="text-white/90">Atención al cliente siempre disponible</p>
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