import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Upload, Settings, Building2, Palette, Save } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface CompanySettings {
  id?: string;
  companyName: string;
  logoUrl?: string;
  primaryColor: string;
  secondaryColor: string;
  address: string;
  phone: string;
  email: string;
  website?: string;
  description?: string;
}

export default function ConfigurationSection() {
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>("");
  const [settings, setSettings] = useState<CompanySettings>({
    companyName: "Arriendo Cajas",
    primaryColor: "#C8201D",
    secondaryColor: "#2E5CA6",
    address: "",
    phone: "",
    email: "",
    website: "",
    description: ""
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Query para obtener configuración actual
  const { data: currentSettings, isLoading } = useQuery({
    queryKey: ["/api/configuration"],
    queryFn: async () => {
      const response = await fetch('/api/configuration');
      if (!response.ok) {
        // Si no existe configuración, usar valores por defecto
        if (response.status === 404) {
          return settings;
        }
        throw new Error('Error loading configuration');
      }
      const data = await response.json();
      setSettings(data);
      if (data.logoUrl) {
        setLogoPreview(data.logoUrl);
      }
      return data;
    }
  });

  // Mutation para guardar configuración
  const saveSettingsMutation = useMutation({
    mutationFn: async (settingsData: CompanySettings) => {
      const response = await fetch('/api/configuration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settingsData)
      });
      
      if (!response.ok) throw new Error('Error saving configuration');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/configuration"] });
      toast({ title: "Éxito", description: "Configuración guardada correctamente" });
    },
    onError: () => {
      toast({ title: "Error", description: "Error al guardar configuración", variant: "destructive" });
    }
  });

  // Mutation para subir logo
  const uploadLogoMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('logo', file);
      
      const response = await fetch('/api/configuration/logo', {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) throw new Error('Error uploading logo');
      return response.json();
    },
    onSuccess: (data) => {
      setSettings(prev => ({ ...prev, logoUrl: data.logoUrl }));
      setLogoPreview(data.logoUrl);
      queryClient.invalidateQueries({ queryKey: ["/api/configuration"] });
      toast({ title: "Éxito", description: "Logo subido correctamente" });
    },
    onError: () => {
      toast({ title: "Error", description: "Error al subir logo", variant: "destructive" });
    }
  });

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setLogoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadLogo = () => {
    if (logoFile) {
      uploadLogoMutation.mutate(logoFile);
    }
  };

  const handleSaveSettings = () => {
    saveSettingsMutation.mutate(settings);
  };

  const handleInputChange = (field: keyof CompanySettings, value: string) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Settings className="h-12 w-12 animate-spin mx-auto mb-4 text-gray-400" />
          <p className="text-gray-600">Cargando configuración...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Configuración</h2>
          <p className="text-gray-600">Personaliza la apariencia y datos de tu empresa</p>
        </div>
        <Button onClick={handleSaveSettings} disabled={saveSettingsMutation.isPending}>
          <Save className="h-4 w-4 mr-2" />
          Guardar Cambios
        </Button>
      </div>

      <Tabs defaultValue="brand" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="brand" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Marca e Identidad
          </TabsTrigger>
          <TabsTrigger value="company" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Datos de Empresa
          </TabsTrigger>
          <TabsTrigger value="advanced" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Configuración Avanzada
          </TabsTrigger>
        </TabsList>

        <TabsContent value="brand" className="space-y-6">
          {/* Logo Upload */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Logo de la Empresa</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="logo-upload">Subir Logo</Label>
                <div className="mt-2 space-y-4">
                  <Input
                    id="logo-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleLogoChange}
                    className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  {logoFile && (
                    <Button 
                      onClick={handleUploadLogo} 
                      disabled={uploadLogoMutation.isPending}
                      className="w-full"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      {uploadLogoMutation.isPending ? 'Subiendo...' : 'Subir Logo'}
                    </Button>
                  )}
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  Formatos recomendados: PNG, JPG, SVG. Tamaño máximo: 2MB
                </p>
              </div>

              <div>
                <Label>Vista Previa</Label>
                <div className="mt-2 p-6 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
                  {logoPreview ? (
                    <div className="text-center">
                      <img 
                        src={logoPreview} 
                        alt="Logo preview" 
                        className="max-h-20 mx-auto object-contain"
                      />
                      <p className="text-sm text-gray-600 mt-2">
                        Así se verá en el sistema
                      </p>
                    </div>
                  ) : (
                    <div className="text-center">
                      <div className="w-16 h-16 bg-red-600 rounded-lg flex items-center justify-center mx-auto">
                        <span className="text-white font-bold text-lg">AC</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-2">
                        Logo por defecto
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Card>

          {/* Brand Colors */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Colores de Marca</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="primary-color">Color Primario</Label>
                <div className="flex items-center gap-3 mt-2">
                  <Input
                    id="primary-color"
                    type="color"
                    value={settings.primaryColor}
                    onChange={(e) => handleInputChange('primaryColor', e.target.value)}
                    className="w-16 h-10 p-1 border rounded"
                  />
                  <Input
                    value={settings.primaryColor}
                    onChange={(e) => handleInputChange('primaryColor', e.target.value)}
                    placeholder="#C8201D"
                    className="flex-1"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="secondary-color">Color Secundario</Label>
                <div className="flex items-center gap-3 mt-2">
                  <Input
                    id="secondary-color"
                    type="color"
                    value={settings.secondaryColor}
                    onChange={(e) => handleInputChange('secondaryColor', e.target.value)}
                    className="w-16 h-10 p-1 border rounded"
                  />
                  <Input
                    value={settings.secondaryColor}
                    onChange={(e) => handleInputChange('secondaryColor', e.target.value)}
                    placeholder="#2E5CA6"
                    className="flex-1"
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* Company Name */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Nombre de la Empresa</h3>
            <div>
              <Label htmlFor="company-name">Nombre que aparecerá en el sistema</Label>
              <Input
                id="company-name"
                value={settings.companyName}
                onChange={(e) => handleInputChange('companyName', e.target.value)}
                placeholder="Arriendo Cajas"
                className="mt-2"
              />
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="company" className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Información de Contacto</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="address">Dirección</Label>
                <Textarea
                  id="address"
                  value={settings.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  placeholder="Dirección completa de la empresa"
                  className="mt-2"
                  rows={3}
                />
              </div>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="phone">Teléfono</Label>
                  <Input
                    id="phone"
                    value={settings.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="+56 9 1234 5678"
                    className="mt-2"
                  />
                </div>
                
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={settings.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="contacto@empresa.cl"
                    className="mt-2"
                  />
                </div>
                
                <div>
                  <Label htmlFor="website">Sitio Web</Label>
                  <Input
                    id="website"
                    value={settings.website}
                    onChange={(e) => handleInputChange('website', e.target.value)}
                    placeholder="https://www.empresa.cl"
                    className="mt-2"
                  />
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Descripción</h3>
            <div>
              <Label htmlFor="description">Descripción de la empresa</Label>
              <Textarea
                id="description"
                value={settings.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Breve descripción de tu empresa y servicios"
                className="mt-2"
                rows={4}
              />
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="advanced" className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Configuración del Sistema</h3>
            <div className="space-y-4">
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <h4 className="font-medium text-yellow-800">Próximamente</h4>
                <p className="text-sm text-yellow-700 mt-1">
                  Configuraciones avanzadas como notificaciones, integraciones y más estarán disponibles pronto.
                </p>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}