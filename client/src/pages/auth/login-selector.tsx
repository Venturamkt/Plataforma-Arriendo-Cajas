import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, Truck, User } from "lucide-react";
import { Link } from "wouter";

export default function LoginSelector() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-blue to-brand-red flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <img 
            src="/logo.png" 
            alt="Arriendo Cajas" 
            className="h-20 mx-auto mb-6 filter brightness-110"
          />
          <h1 className="text-5xl font-bold text-white mb-4 drop-shadow-2xl" style={{textShadow: '2px 2px 4px rgba(0,0,0,0.8)'}}>
            Arriendo Cajas
          </h1>
          <p className="text-white text-xl font-medium drop-shadow-xl" style={{textShadow: '1px 1px 3px rgba(0,0,0,0.7)'}}>
            Sistema de gestión integral para arriendo de cajas plásticas
          </p>
        </div>

        {/* Login Options */}
        <div className="grid md:grid-cols-3 gap-6">
          {/* Cliente */}
          <Card className="hover:shadow-lg transition-shadow bg-white/95 backdrop-blur">
            <CardHeader className="text-center pb-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <User className="w-8 h-8 text-green-600" />
              </div>
              <CardTitle className="text-xl text-gray-800">
                Acceso Cliente
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-gray-800 font-medium mb-6">
                Consulta tus arriendos con RUT o correo electrónico
              </p>
              <Link href="/auth/customer">
                <Button className="w-full bg-green-600 hover:bg-green-700 text-white">
                  Ingresar como Cliente
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Repartidor */}
          <Card className="hover:shadow-lg transition-shadow bg-white/95 backdrop-blur">
            <CardHeader className="text-center pb-4">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Truck className="w-8 h-8 text-blue-600" />
              </div>
              <CardTitle className="text-xl text-gray-800">
                Portal Repartidor
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-gray-800 font-medium mb-6">
                Gestiona entregas y tareas diarias
              </p>
              <Link href="/auth/driver">
                <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                  Ingresar como Repartidor
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Administrador */}
          <Card className="hover:shadow-lg transition-shadow bg-white/95 backdrop-blur">
            <CardHeader className="text-center pb-4">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-red-600" />
              </div>
              <CardTitle className="text-xl text-gray-800">
                Panel Administrador
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-gray-800 font-medium mb-6">
                Control total del sistema y reportes
              </p>
              <Link href="/auth/admin">
                <Button className="w-full bg-red-600 hover:bg-red-700 text-white">
                  Ingresar como Admin
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="text-center mt-12">
          <p className="text-blue-100 text-sm">
            Sistema de gestión integral para negocios de arriendo de cajas plásticas
          </p>
        </div>
      </div>
    </div>
  );
}