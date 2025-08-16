// Utilidades para cálculos de precios y formateo

export const formatCurrency = (amount: string | number): string => {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return '$0';
  
  // Formato chileno: $2.000, $15.000, etc.
  return '$' + num.toLocaleString('es-CL', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
};

export const calculateGuarantee = (boxQuantity: number): number => {
  return boxQuantity * 2000; // $2.000 por caja (formato chileno)
};

export const calculateReturnDate = (startDate: string, rentalDays: number): string => {
  const start = new Date(startDate);
  const returnDate = new Date(start);
  returnDate.setDate(start.getDate() + rentalDays);
  return returnDate.toISOString().split('T')[0];
};

export const calculateTotalAmount = (
  boxQuantity: number,
  rentalDays: number,
  pricePerDay: number,
  additionalProducts: {name: string, quantity: number, price: number}[] = []
): number => {
  const baseAmount = boxQuantity * rentalDays * pricePerDay;
  const additionalAmount = additionalProducts.reduce((sum, product) => 
    sum + (product.quantity * product.price * rentalDays), 0
  );
  const guarantee = calculateGuarantee(boxQuantity);
  
  return baseAmount + additionalAmount + guarantee;
};

// Shortcuts predefinidos
export const BOX_QUANTITY_SHORTCUTS = [2, 5, 10, 15];
export const RENTAL_DAYS_SHORTCUTS = [7, 14, 30];

// Productos adicionales comunes
export const ADDITIONAL_PRODUCTS = [
  { name: "Carrito plegable", price: 500 },
  { name: "Base móvil", price: 300 },
  { name: "Kit 2 bases móviles", price: 500 },
  { name: "Correa Ratchet", price: 200 },
];