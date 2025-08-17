import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, User, Search } from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";

// Función para formatear RUT automáticamente
const formatRUT = (value: string) => {
  // Remover todo excepto números y K
  const cleanValue = value.replace(/[^0-9kK]/g, '');
  
  if (cleanValue.length === 0) return '';
  if (cleanValue.length === 1) return cleanValue;
  
  // Separar cuerpo y dígito verificador
  const body = cleanValue.slice(0, -1);
  const dv = cleanValue.slice(-1).toUpperCase();
  
  // Formatear el cuerpo con puntos
  let formattedBody = '';
  
  if (body.length <= 3) {
    formattedBody = body;
  } else if (body.length <= 6) {
    formattedBody = body.slice(0, -3) + '.' + body.slice(-3);
  } else {
    const millions = body.slice(0, -6);
    const thousands = body.slice(-6, -3);
    const hundreds = body.slice(-3);
    formattedBody = millions + '.' + thousands + '.' + hundreds;
  }
  
  return formattedBody + '-' + dv;
};

export default function CustomerLogin() {
  const [searchType, setSearchType] = useState<'rut' | 'email'>('rut');
  const [searchValue, setSearchValue] = useState('');
  const { toast } = useToast();

  const customerAccessMutation = useMutation({
    mutationFn: async (data: { type: string; value: string }) => {
      const response = await fetch('/api/auth/customer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('No se encontraron arriendos');
      return response.json();
    },
    onSuccess: () => {
      // Redirect to customer dashboard
      window.location.href = '/customer/dashboard';
    },
    onError: (error: Error) => {
      toast({
        title: "No encontrado",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchValue.trim()) {
      toast({
        title: "Campo requerido",
        description: `Ingrese su ${searchType === 'rut' ? 'RUT' : 'correo electrónico'}`,
        variant: "destructive",
      });
      return;
    }

    // Para RUT enviar el valor formateado tal como está, para email limpiarlo
    const cleanValue = searchType === 'rut' 
      ? searchValue.trim() // Mantener el formato con puntos y guión
      : searchValue.trim();
    
    customerAccessMutation.mutate({
      type: searchType,
      value: cleanValue,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-600 to-green-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Back Button */}
        <Link href="/">
          <Button variant="ghost" className="text-white hover:bg-white/10 mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
        </Link>

        {/* Login Card */}
        <Card className="bg-white/95 backdrop-blur">
          <CardHeader className="text-center pb-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="w-8 h-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl text-gray-800">
              Acceso Cliente
            </CardTitle>
            <p className="text-gray-600">
              Consulta el estado de tus arriendos
            </p>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Search Type Selector */}
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant={searchType === 'rut' ? 'default' : 'outline'}
                  onClick={() => {
                    setSearchType('rut');
                    setSearchValue('');
                  }}
                  className="w-full"
                >
                  Por RUT
                </Button>
                <Button
                  type="button"
                  variant={searchType === 'email' ? 'default' : 'outline'}
                  onClick={() => {
                    setSearchType('email');
                    setSearchValue('');
                  }}
                  className="w-full"
                >
                  Por Email
                </Button>
              </div>

              {/* Search Input */}
              <div className="space-y-2">
                <Label htmlFor="search">
                  {searchType === 'rut' ? 'RUT' : 'Correo Electrónico'}
                </Label>
                <Input
                  id="search"
                  type={searchType === 'email' ? 'email' : 'text'}
                  placeholder={
                    searchType === 'rut' 
                      ? 'Ej: 12.345.678-9' 
                      : 'Ej: cliente@empresa.cl'
                  }
                  value={searchValue}
                  onChange={(e) => {
                    const inputValue = e.target.value;
                    if (searchType === 'rut') {
                      // Limitar la longitud máxima del RUT (12 caracteres: 12.345.678-9)
                      const cleanInput = inputValue.replace(/[^0-9kK]/g, '');
                      if (cleanInput.length <= 9) {
                        setSearchValue(formatRUT(inputValue));
                      }
                    } else {
                      setSearchValue(inputValue);
                    }
                  }}
                  className="text-center text-lg"
                />
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full bg-green-600 hover:bg-green-700 text-white"
                disabled={customerAccessMutation.isPending}
              >
                {customerAccessMutation.isPending ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Buscando...
                  </div>
                ) : (
                  <>
                    <Search className="w-4 h-4 mr-2" />
                    Consultar Arriendos
                  </>
                )}
              </Button>
            </form>

            {/* Info */}
            <div className="mt-6 p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-green-800">
                <strong>💡 Tip:</strong> Ingresa tu RUT o correo electrónico para ver 
                todos tus arriendos activos y el historial.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}