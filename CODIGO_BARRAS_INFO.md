# Códigos de Barras - Arriendo Cajas

## Formato Estándar

**Estructura**: `AC` + `YY` + `MM` + `DD` + `NNNN`

- **AC**: Prefijo fijo "Arriendo Cajas"
- **YY**: Año (2 dígitos) - Ej: 25 para 2025
- **MM**: Mes (2 dígitos) - Ej: 01 para enero
- **DD**: Día (2 dígitos) - Ej: 09 para día 9
- **NNNN**: Número secuencial (4 dígitos) - Ej: 0001, 0002...

## Ejemplos de Códigos

- `AC2501090001` - Primera caja del 9 de enero 2025
- `AC2501090002` - Segunda caja del 9 de enero 2025
- `AC2512311234` - Caja #1234 del 31 de diciembre 2025

## Características Técnicas

### Compatible con estándares:
- **Code 128**: Recomendado (soporta alfanuméricos)
- **Code 39**: Alternativa (solo mayúsculas y números)
- **EAN-13**: No compatible (solo números, 13 dígitos)

### Especificaciones para impresión:
- **Longitud**: 13 caracteres
- **Tipo**: Alfanumérico
- **Altura mínima**: 15mm para lectura confiable
- **Ancho mínimo**: 0.25mm por barra
- **Zona silenciosa**: 10x el ancho de barra mínimo

## Apps de Escáner Recomendadas

### Para dispositivos móviles:
1. **ZXing ("Zebra Crossing")** - Gratis, código abierto
2. **QR & Barcode Scanner** - Simple y rápido
3. **Barcode Scanner+** - Interfaz amigable

### Para computadoras:
1. **ZBar** - Librería para desarrollo
2. **QuaggaJS** - Para aplicaciones web

## Validación del Sistema

El sistema reconoce automáticamente:
- Códigos que empiecen con "AC"
- Longitud de 13 caracteres
- Formato de fecha válido
- Números secuenciales únicos

## Proceso de Implementación

1. **Generar código** desde el sistema
2. **Imprimir etiqueta** con código de barras
3. **Pegar en la caja** en lugar visible
4. **Escanear para verificar** que se lee correctamente
5. **Registrar en el sistema** si se creó manualmente

## Solución de Problemas

### Si el escáner no lee:
- Verificar que la etiqueta esté limpia
- Ajustar la distancia (5-30cm típicamente)
- Verificar que hay buena iluminación
- Probar con otro escáner/app

### Si el código no se reconoce en el sistema:
- Verificar que empiece con "AC"
- Confirmar que tiene exactamente 13 caracteres
- Revisar que la fecha esté en formato correcto
- Verificar que no esté duplicado

## Recomendaciones

1. **Usar etiquetas resistentes** al agua y desgaste
2. **Imprimir en alta calidad** para mejor lectura
3. **Colocar en superficie plana** de la caja
4. **Evitar doblar o dañar** el código de barras
5. **Tener respaldo digital** de todos los códigos generados