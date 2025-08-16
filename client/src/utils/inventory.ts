// Utilidades para verificación de inventario

export interface InventoryCheck {
  available: boolean;
  availableQuantity: number;
  message: string;
  severity: 'success' | 'warning' | 'error';
}

export const checkInventoryAvailability = async (
  requestedQuantity: number,
  deliveryDate: string,
  pickupDate: string
): Promise<InventoryCheck> => {
  try {
    const response = await fetch(`/api/inventory/check?quantity=${requestedQuantity}&delivery=${deliveryDate}&pickup=${pickupDate}`);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Error al verificar inventario');
    }
    
    return data;
  } catch (error) {
    console.error('Error checking inventory:', error);
    return {
      available: false,
      availableQuantity: 0,
      message: 'Error al verificar disponibilidad',
      severity: 'error'
    };
  }
};

// Mock para desarrollo - simula verificación de inventario
export const mockInventoryCheck = (
  requestedQuantity: number,
  deliveryDate: string,
  pickupDate: string
): InventoryCheck => {
  // Simulamos que tenemos 50 cajas totales
  const totalBoxes = 50;
  
  // Simulamos reservas existentes (esto vendría de la base de datos)
  const existingReservations = Math.floor(Math.random() * 20);
  const availableQuantity = totalBoxes - existingReservations;
  
  if (requestedQuantity <= availableQuantity) {
    return {
      available: true,
      availableQuantity,
      message: `✅ Disponibles: ${availableQuantity} cajas para las fechas seleccionadas`,
      severity: 'success'
    };
  } else if (availableQuantity > 0) {
    return {
      available: false,
      availableQuantity,
      message: `⚠️ Solo ${availableQuantity} cajas disponibles (solicitas ${requestedQuantity})`,
      severity: 'warning'
    };
  } else {
    return {
      available: false,
      availableQuantity: 0,
      message: `❌ Sin cajas disponibles para las fechas seleccionadas`,
      severity: 'error'
    };
  }
};