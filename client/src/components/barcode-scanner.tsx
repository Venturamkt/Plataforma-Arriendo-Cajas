import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Camera, X, Keyboard } from "lucide-react";

interface BarcodeScannerProps {
  onScan: (barcode: string) => void;
  onClose: () => void;
}

export default function BarcodeScanner({ onScan, onClose }: BarcodeScannerProps) {
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualCode, setManualCode] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    try {
      setIsScanning(true);
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "environment" } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
      }
    } catch (error) {
      console.error("Error accessing camera:", error);
      setShowManualInput(true);
      setIsScanning(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsScanning(false);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCode.trim()) {
      onScan(manualCode.trim());
    }
  };

  // Mock scan simulation for demo purposes
  const handleMockScan = () => {
    const mockBarcode = "CJ-" + Math.random().toString(36).substr(2, 6).toUpperCase();
    onScan(mockBarcode);
  };

  const handleClose = () => {
    stopCamera();
    onClose();
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={handleOverlayClick}>
      <Card className="w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-gray-900">
              Escanear Código de Barras
            </CardTitle>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleClose();
              }} 
              className="hover:bg-gray-100 z-10"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
          <p className="text-sm text-gray-600">
            Apunta la cámara hacia el código de la caja
          </p>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {!showManualInput ? (
            <>
              {/* Camera View */}
              <div className="bg-gray-900 rounded-lg aspect-video flex items-center justify-center overflow-hidden">
                {isScanning ? (
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-white text-center">
                    <Camera className="w-12 h-12 mx-auto mb-2" />
                    <p className="text-sm">Activando cámara...</p>
                  </div>
                )}
                
                {/* Scanning overlay */}
                {isScanning && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="border-2 border-brand-red rounded-lg w-48 h-32 relative">
                      <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-brand-red"></div>
                      <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-brand-red"></div>
                      <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-brand-red"></div>
                      <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-brand-red"></div>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex space-x-3">
                <Button 
                  variant="outline" 
                  className="flex-1" 
                  onClick={() => setShowManualInput(true)}
                >
                  <Keyboard className="w-4 h-4 mr-2" />
                  Ingresar Código
                </Button>
                <Button 
                  className="flex-1 bg-brand-red hover:bg-brand-red text-white" 
                  onClick={handleMockScan}
                >
                  Simular Escaneo
                </Button>
              </div>
            </>
          ) : (
            <>
              {/* Manual Input */}
              <form onSubmit={handleManualSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="barcode">Código de Barras</Label>
                  <Input
                    id="barcode"
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value)}
                    placeholder="Ej: CJ-001247"
                    className="mt-1"
                    autoFocus
                  />
                </div>
                
                <div className="flex space-x-3">
                  <Button 
                    type="button"
                    variant="outline" 
                    className="flex-1" 
                    onClick={() => setShowManualInput(false)}
                  >
                    Usar Cámara
                  </Button>
                  <Button 
                    type="submit"
                    className="flex-1 bg-brand-red hover:bg-brand-red text-white"
                    disabled={!manualCode.trim()}
                  >
                    Buscar
                  </Button>
                </div>
              </form>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
