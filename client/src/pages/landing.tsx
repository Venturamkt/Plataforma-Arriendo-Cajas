import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, Users, TruckIcon, BarChart3 } from "lucide-react";

export default function Landing() {
  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Package className="h-8 w-8 text-box-blue mr-3" />
              <h1 className="text-xl font-bold text-brand-blue">Arriendo Cajas</h1>
            </div>
            <Button onClick={handleLogin} className="bg-brand-red hover:bg-brand-red text-white">
              Iniciar Sesión
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
            Sistema de Gestión de
            <span className="text-brand-blue block">Arriendo de Cajas</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Plataforma completa para administrar el inventario, entregas y clientes de tu negocio de arriendo de cajas plásticas.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button onClick={handleLogin} size="lg" className="bg-brand-red hover:bg-brand-red text-white">
              Acceder al Sistema
            </Button>
            <Button variant="outline" size="lg" className="border-brand-blue text-brand-blue hover:bg-brand-blue hover:text-white">
              Conocer Más
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Funcionalidades Principales
            </h2>
            <p className="text-lg text-gray-600">
              Todo lo que necesitas para gestionar tu negocio de arriendo de cajas
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card>
              <CardHeader>
                <Package className="h-10 w-10 text-box-blue mb-4" />
                <CardTitle>Gestión de Inventario</CardTitle>
                <CardDescription>
                  Control completo del estado de tus cajas con seguimiento por código de barras
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li>• Escaneo de códigos de barras</li>
                  <li>• Estados de caja detallados</li>
                  <li>• Historial de movimientos</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Users className="h-10 w-10 text-brand-blue mb-4" />
                <CardTitle>Base de Datos de Clientes</CardTitle>
                <CardDescription>
                  Gestiona información completa de clientes y su historial de arriendos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li>• Perfiles de cliente detallados</li>
                  <li>• Historial de arriendos</li>
                  <li>• Notificaciones automáticas</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <TruckIcon className="h-10 w-10 text-green-600 mb-4" />
                <CardTitle>Gestión de Entregas</CardTitle>
                <CardDescription>
                  Panel para repartidores con tareas de entrega y retiro organizadas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li>• Asignación de tareas</li>
                  <li>• Actualización de estados</li>
                  <li>• Reporte de incidencias</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <BarChart3 className="h-10 w-10 text-purple-600 mb-4" />
                <CardTitle>Reportes y Métricas</CardTitle>
                <CardDescription>
                  Dashboard con métricas clave e informes económicos detallados
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li>• Dashboard en tiempo real</li>
                  <li>• Reportes de ingresos</li>
                  <li>• Análisis de rendimiento</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="md:col-span-2 lg:col-span-1">
              <CardHeader>
                <div className="h-10 w-10 bg-gradient-to-r from-brand-red to-brand-blue rounded-lg flex items-center justify-center mb-4">
                  <Package className="h-6 w-6 text-white" />
                </div>
                <CardTitle>Multi-Rol</CardTitle>
                <CardDescription>
                  Acceso diferenciado para administradores, repartidores y clientes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li>• Panel de administración</li>
                  <li>• App para repartidores</li>
                  <li>• Portal de clientes</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-brand-blue">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            ¿Listo para optimizar tu negocio?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Inicia sesión para acceder a todas las funcionalidades del sistema
          </p>
          <Button onClick={handleLogin} size="lg" className="bg-brand-red hover:bg-brand-red text-white">
            Iniciar Sesión
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto text-center">
          <div className="flex items-center justify-center mb-4">
            <Package className="h-6 w-6 text-box-blue mr-2" />
            <span className="font-semibold">Arriendo Cajas</span>
          </div>
          <p className="text-gray-400">
            Sistema de gestión integral para negocios de arriendo de cajas plásticas
          </p>
        </div>
      </footer>
    </div>
  );
}
