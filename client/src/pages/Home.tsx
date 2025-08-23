import { Link } from "wouter";
import { Users, Search, Shield } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-700 to-blue-500 flex items-center justify-center px-4">
      <div className="max-w-4xl mx-auto text-center">
        {/* Logo and Title */}
        <div className="mb-12">
          <div className="mb-6">
            <div className="w-24 h-24 mx-auto mb-4 bg-red-600 rounded-lg flex items-center justify-center">
              <div className="text-white text-2xl font-bold">AC</div>
            </div>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-4">
            Arriendo Cajas
          </h1>
          <p className="text-xl text-blue-100 mb-12">
            Sistema de gestión integral para arriendo de cajas plásticas
          </p>
        </div>

        {/* Access Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
          {/* Customer Access */}
          <div className="bg-white rounded-xl p-8 shadow-2xl hover:shadow-3xl transition-all duration-300 hover:-translate-y-2">
            <div className="text-green-600 mb-6">
              <Users size={64} className="mx-auto" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-4">
              Acceso Cliente
            </h3>
            <p className="text-gray-600 mb-6">
              Consulta tus arriendos con RUT o correo electrónico
            </p>
            <Link href="/customers">
              <button className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors">
                Ingresar como Cliente
              </button>
            </Link>
          </div>

          {/* Driver Portal */}
          <div className="bg-white rounded-xl p-8 shadow-2xl hover:shadow-3xl transition-all duration-300 hover:-translate-y-2">
            <div className="text-blue-600 mb-6">
              <Search size={64} className="mx-auto" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-4">
              Portal Repartidor
            </h3>
            <p className="text-gray-600 mb-6">
              Gestiona entregas y tareas diarias
            </p>
            <Link href="/drivers">
              <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors">
                Ingresar como Repartidor
              </button>
            </Link>
          </div>

          {/* Admin Panel */}
          <div className="bg-white rounded-xl p-8 shadow-2xl hover:shadow-3xl transition-all duration-300 hover:-translate-y-2">
            <div className="text-red-600 mb-6">
              <Shield size={64} className="mx-auto" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-4">
              Panel Administrador
            </h3>
            <p className="text-gray-600 mb-6">
              Control total del sistema y reportes
            </p>
            <Link href="/admin/login">
              <button className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors">
                Ingresar como Admin
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}