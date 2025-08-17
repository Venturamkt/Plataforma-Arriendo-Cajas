// Utilidades para generar códigos de tracking

// Generar tracking code: últimos 4 dígitos antes del dígito verificador del RUT + 5 caracteres aleatorios
export function generateTrackingCode(rut: string): string {
  // Limpiar RUT (remover puntos y guión)
  const cleanRut = rut.replace(/[.-]/g, '');
  
  // Obtener últimos 4 dígitos ANTES del dígito verificador (excluir último dígito)
  const rutWithoutVerification = cleanRut.slice(0, -1);
  const lastFourDigits = rutWithoutVerification.slice(-4);
  
  // Generar 5 caracteres aleatorios
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let randomChars = '';
  for (let i = 0; i < 5; i++) {
    randomChars += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return `${lastFourDigits}${randomChars}`;
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