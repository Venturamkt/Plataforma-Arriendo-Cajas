// Utilidades para manejo de RUT chileno

export interface RutValidationResult {
  isValid: boolean;
  formattedRut: string;
  cleanRut: string;
  verifierDigit: string;
}

/**
 * Formatea un RUT agregando puntos y guión automáticamente
 * Ejemplo: "123456789" -> "12.345.678-9"
 */
export function formatRut(input: string): string {
  // Remover todos los caracteres que no sean números o K
  const cleanRut = input.replace(/[^\dkK]/g, '').toUpperCase();
  
  if (cleanRut.length === 0) return '';
  
  // Si es muy corto, devolver tal como está
  if (cleanRut.length <= 1) return cleanRut;
  
  // Separar cuerpo y dígito verificador
  const body = cleanRut.slice(0, -1);
  const digit = cleanRut.slice(-1);
  
  // Formatear el cuerpo con puntos
  let formattedBody = '';
  for (let i = body.length - 1, j = 0; i >= 0; i--, j++) {
    if (j > 0 && j % 3 === 0) {
      formattedBody = '.' + formattedBody;
    }
    formattedBody = body[i] + formattedBody;
  }
  
  return `${formattedBody}-${digit}`;
}

/**
 * Calcula el dígito verificador usando el algoritmo Módulo 11
 */
export function calculateVerifierDigit(rutBody: string): string {
  const cleanBody = rutBody.replace(/[^\d]/g, '');
  
  if (cleanBody.length === 0) return '';
  
  // Multiplicadores: 2, 3, 4, 5, 6, 7, y se repite
  const multipliers = [2, 3, 4, 5, 6, 7];
  let sum = 0;
  
  // Iterar desde derecha a izquierda
  for (let i = cleanBody.length - 1, j = 0; i >= 0; i--, j++) {
    const digit = parseInt(cleanBody[i]);
    const multiplier = multipliers[j % 6];
    sum += digit * multiplier;
  }
  
  // Calcular módulo 11
  const remainder = sum % 11;
  const result = 11 - remainder;
  
  // Casos especiales
  if (result === 11) return '0';
  if (result === 10) return 'K';
  
  return result.toString();
}

/**
 * Valida un RUT completo usando el algoritmo Módulo 11
 */
export function validateRut(rut: string): RutValidationResult {
  const cleanRut = rut.replace(/[^\dkK]/g, '').toUpperCase();
  
  if (cleanRut.length < 2) {
    return {
      isValid: false,
      formattedRut: formatRut(rut),
      cleanRut: cleanRut,
      verifierDigit: ''
    };
  }
  
  const body = cleanRut.slice(0, -1);
  const providedDigit = cleanRut.slice(-1);
  const calculatedDigit = calculateVerifierDigit(body);
  
  const isValid = providedDigit === calculatedDigit;
  const formattedRut = formatRut(cleanRut);
  
  return {
    isValid,
    formattedRut,
    cleanRut,
    verifierDigit: calculatedDigit
  };
}

/**
 * Hook de React para manejar entrada de RUT con formateo automático
 */
export function useRutInput(initialValue: string = '') {
  const [value, setValue] = useState(initialValue);
  const [validation, setValidation] = useState<RutValidationResult | null>(null);
  
  const handleChange = (newValue: string) => {
    const formatted = formatRut(newValue);
    setValue(formatted);
    
    // Solo validar si tiene suficientes caracteres
    if (formatted.length >= 3) {
      const validationResult = validateRut(formatted);
      setValidation(validationResult);
    } else {
      setValidation(null);
    }
  };
  
  return {
    value,
    setValue: handleChange,
    validation,
    isValid: validation?.isValid ?? null,
    formattedValue: value
  };
}

// Importar useState para el hook
import { useState } from 'react';