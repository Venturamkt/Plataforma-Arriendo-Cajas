// Utilidades para generar códigos de tracking

// Generar tracking code: últimos 4 dígitos antes del dígito verificador sin el guión
export function generateTrackingCode(rentalId: string): string {
  // Extraer los últimos 4 dígitos antes del último guión
  const parts = rentalId.split('-');
  const lastPart = parts[parts.length - 1]; // Último segmento
  const beforeLast = parts[parts.length - 2]; // Penúltimo segmento
  
  // Tomar los últimos 4 caracteres del penúltimo segmento
  return beforeLast.slice(-4).toUpperCase();
}

// Generar token aleatorio de 5 caracteres (letras + números)
export function generateTrackingToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 5; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Generar URL completa de tracking
export function generateTrackingUrl(trackingCode: string, trackingToken: string): string {
  const baseUrl = process.env.NODE_ENV === 'production' 
    ? 'https://arriendocajas.cl' 
    : 'http://localhost:5000';
  
  return `${baseUrl}/track/${trackingCode}/${trackingToken}`;
}