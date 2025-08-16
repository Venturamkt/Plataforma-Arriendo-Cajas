import { Link } from "wouter";
import CompanyLogo from "@/components/CompanyLogo";
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
        
        <div className="relative z-10 container mx-auto px-4 py-8 lg:py-16 text-center text-white">
          <div className="mb-8 lg:mb-12">
            <div className="flex justify-center mb-6 lg:mb-8">
              <CompanyLogo size="lg" className="text-white" />
            </div>
            <p className="text-lg sm:text-xl lg:text-2xl mb-8 lg:mb-12 max-w-3xl mx-auto text-white/90">
              Sistema de gestión integral para arriendo de cajas plásticas
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 lg:gap-8 max-w-5xl mx-auto mb-12 lg:mb-16">
            <Card className="bg-white/95 backdrop-blur-sm text-gray-900 border-0 shadow-2xl">
              <CardHeader className="text-center pb-4">
                <Users className="h-16 w-16 text-green-600 mx-auto mb-4" />
                <CardTitle className="text-xl font-bold">Acceso Cliente</CardTitle>
                <CardDescription className="text-gray-600">
                  Consulta tus arriendos con RUT o correo electrónico
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/auth/customer">
                  <Button className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3">
                    Ingresar como Cliente
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="bg-white/95 backdrop-blur-sm text-gray-900 border-0 shadow-2xl">
              <CardHeader className="text-center pb-4">
                <Search className="h-16 w-16 text-blue-600 mx-auto mb-4" />
                <CardTitle className="text-xl font-bold">Portal Repartidor</CardTitle>
                <CardDescription className="text-gray-600">
                  Gestiona entregas y tareas diarias
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/auth/driver">
                  <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3">
                    Ingresar como Repartidor
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="bg-white/95 backdrop-blur-sm text-gray-900 border-0 shadow-2xl">
              <CardHeader className="text-center pb-4">
                <ShieldCheck className="h-16 w-16 text-red-600 mx-auto mb-4" />
                <CardTitle className="text-xl font-bold">Panel Administrador</CardTitle>
                <CardDescription className="text-gray-600">
                  Control total del sistema y reportes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/auth/admin">
                  <Button className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3">
                    Ingresar como Admin
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>


        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-6 lg:py-8">
        <div className="container mx-auto px-4 text-center">
          <div className="mb-4">
            <CompanyLogo className="mx-auto mb-4 opacity-80 text-white" />
          </div>
          <p className="mb-2 text-sm lg:text-base">Tu solución de almacenamiento temporal</p>
          <p className="text-gray-400 text-sm lg:text-base">¿Preguntas? Contáctanos: contacto@arriendocajas.cl</p>
        </div>
      </footer>
    </div>
  );
}