import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { Loader2, CheckCircle, XCircle, AlertTriangle, Database } from "lucide-react";

interface TestResult {
  rut: string;
  code: string;
  success: boolean;
  data?: any;
  error?: string;
}

export function FinalDiagnosis() {
  const [activeCode, setActiveCode] = useState<string>("2OB1DQ4Q");
  const [results, setResults] = useState<TestResult[]>([]);
  const [testing, setTesting] = useState(false);

  // Combinaciones de RUT digits y tracking codes a probar
  const testCombinations = [
    // RUT genérico actual (desarrollo)
    { rut: "5678", description: "RUT genérico actual", source: "desarrollo" },
    // RUT anterior (posible producción)
    { rut: "0939", description: "RUT anterior personal", source: "producción?" },
    // Otras variantes
    { rut: "2209", description: "Variante RUT anterior", source: "alternativa" },
    { rut: "1111", description: "RUT patrón", source: "test" },
  ];

  const runCompleteTest = async () => {
    setTesting(true);
    setResults([]);
    const newResults: TestResult[] = [];

    for (const combo of testCombinations) {
      try {
        console.log(`Testing: /api/track/${combo.rut}/${activeCode}`);
        const response = await fetch(`/api/track/${combo.rut}/${activeCode}`);
        const data = await response.json();
        
        newResults.push({
          rut: combo.rut,
          code: activeCode,
          success: response.ok,
          data: response.ok ? data : null,
          error: response.ok ? undefined : data.message
        });
      } catch (error) {
        newResults.push({
          rut: combo.rut,
          code: activeCode,
          success: false,
          error: error instanceof Error ? error.message : 'Network error'
        });
      }
    }

    setResults(newResults);
    setTesting(false);
  };

  const environment = window.location.hostname.includes('arriendocajas.cl') ? 'Producción' : 'Desarrollo';

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-blue-50 p-4">
      <div className="container mx-auto max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Diagnóstico Final - Análisis Profundo
          </h1>
          <Badge variant={environment === 'Producción' ? 'destructive' : 'default'} className="text-lg px-4 py-2 mb-4">
            <Database className="h-4 w-4 mr-2" />
            Ambiente: {environment}
          </Badge>
          <p className="text-gray-600 text-lg">
            Prueba sistemática del mismo código con diferentes combinaciones de RUT
          </p>
        </div>

        {/* Code Selection */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Código de Tracking a Probar</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2 mb-4">
              {["2OB1DQ4Q", "IHNQQ9KB", "G90AZYEG", "4N4HGCFI"].map(code => (
                <Button
                  key={code}
                  variant={activeCode === code ? "default" : "outline"}
                  onClick={() => setActiveCode(code)}
                  className="font-mono"
                >
                  {code}
                </Button>
              ))}
            </div>
            <Button 
              onClick={runCompleteTest} 
              disabled={testing}
              className="w-full"
              size="lg"
            >
              {testing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Probando todas las combinaciones...
                </>
              ) : (
                <>
                  Ejecutar Prueba Completa
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Test Results */}
        {results.length > 0 && (
          <div className="space-y-4 mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Resultados de Prueba</h2>
            
            {testCombinations.map((combo, index) => {
              const result = results[index];
              const comboInfo = testCombinations[index];
              
              return (
                <Card key={combo.rut} className={result?.success ? "border-green-200" : "border-red-200"}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>RUT digits: {combo.rut}</span>
                      <div className="flex items-center">
                        {result?.success ? (
                          <Badge variant="default" className="bg-green-600">
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Encontrado
                          </Badge>
                        ) : (
                          <Badge variant="destructive">
                            <XCircle className="h-4 w-4 mr-1" />
                            No encontrado
                          </Badge>
                        )}
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div>
                        <label className="text-sm font-medium text-gray-500">Descripción</label>
                        <p>{comboInfo.description}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Origen Esperado</label>
                        <p>{comboInfo.source}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">URL Probada</label>
                        <p className="font-mono text-sm">/track/{combo.rut}/{activeCode}</p>
                      </div>
                    </div>

                    {result?.success && result.data && (
                      <div className="bg-green-50 p-4 rounded-lg">
                        <h4 className="font-medium text-green-800 mb-2">Datos del Arriendo:</h4>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div><strong>Estado:</strong> {result.data.status}</div>
                          <div><strong>ID:</strong> {result.data.id?.slice(0, 8)}...</div>
                        </div>
                      </div>
                    )}

                    {!result?.success && (
                      <div className="bg-red-50 p-4 rounded-lg">
                        <p className="text-red-700 text-sm">
                          <strong>Error:</strong> {result?.error || 'Unknown error'}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Analysis */}
        {results.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2" />
                Análisis y Conclusiones
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {results.some(r => r.success) ? (
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h4 className="font-medium text-green-800 mb-2">✅ Códigos que funcionan:</h4>
                    {results.filter(r => r.success).map((r, i) => (
                      <p key={i} className="text-green-700 text-sm">
                        • RUT digits <strong>{r.rut}</strong> → {testCombinations.find(c => c.rut === r.rut)?.description}
                      </p>
                    ))}
                  </div>
                ) : (
                  <div className="bg-red-50 p-4 rounded-lg">
                    <h4 className="font-medium text-red-800 mb-2">❌ Ningún código funciona</h4>
                    <p className="text-red-700 text-sm">
                      El tracking code "{activeCode}" no existe en la base de datos de {environment.toLowerCase()}.
                    </p>
                  </div>
                )}

                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-800 mb-2">🔍 Interpretación:</h4>
                  {environment === 'Desarrollo' ? (
                    <div className="text-blue-700 text-sm space-y-1">
                      <p>• Si funciona con <strong>5678</strong> → Datos actualizados con RUT genérico</p>
                      <p>• Si funciona con <strong>0939</strong> → Datos anteriores con RUT personal</p>
                      <p>• En desarrollo deberían funcionar principalmente los RUT genéricos</p>
                    </div>
                  ) : (
                    <div className="text-blue-700 text-sm space-y-1">
                      <p>• Si funciona con <strong>0939</strong> → Producción tiene datos antiguos sin actualizar</p>
                      <p>• Si funciona con <strong>5678</strong> → Producción está sincronizada</p>
                      <p>• Si nada funciona → El código no existe en esta base de datos</p>
                    </div>
                  )}
                </div>

                <div className="bg-orange-50 p-4 rounded-lg">
                  <h4 className="font-medium text-orange-800 mb-2">⚡ Recomendación:</h4>
                  <p className="text-orange-700 text-sm">
                    {environment === 'Producción' 
                      ? 'Si solo funcionan los RUT "0939", necesitas hacer deployment para sincronizar la base de datos con los cambios de privacidad.'
                      : 'Si todo funciona aquí pero falla en producción, confirma que necesitas hacer deployment.'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}