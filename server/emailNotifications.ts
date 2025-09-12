import { sendEmail, type EmailData } from './emailService';
import { generateTrackingUrl } from './trackingUtils';
import { storage } from './storage';
import type { EmailLog } from '@shared/schema';

// HTML escaping function to prevent XSS attacks
function escapeHtml(text: string | null | undefined): string {
  if (text === null || text === undefined) return '';
  
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Alternative HTML escaping for server-side (since document may not be available)
function escapeHtmlServer(text: string | null | undefined): string {
  if (text === null || text === undefined) return '';
  
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

export interface RentalEmailData {
  customerName: string;
  customerEmail: string;
  trackingCode: string;
  trackingToken: string;
  boxQuantity: number;
  deliveryDate: string;
  pickupDate: string;
  deliveryAddress: string;
  driverName?: string;
  driverPhone?: string;
  status: string;
  totalAmount?: number;
  baseRentalPrice?: number;
  guaranteeAmount?: number;
  additionalProducts?: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  rentalId?: string;
  customerId?: string;
}

// Función auxiliar para registrar logs de emails
async function logEmail(
  emailType: string,
  emailData: EmailData,
  htmlContent: string,
  rentalId?: string,
  customerId?: string,
  status: 'sent' | 'failed' = 'sent',
  errorMessage?: string,
  customerName?: string
): Promise<void> {
  try {
    await storage.createEmailLog({
      emailType,
      toEmail: Array.isArray(emailData.to) ? emailData.to.join(', ') : emailData.to,
      toName: customerName || null,
      subject: emailData.subject,
      htmlContent,
      rentalId,
      customerId,
      status,
      errorMessage,
    });
  } catch (error) {
    console.error('Error logging email:', error);
  }
}

// Función wrapper que envía email y registra log automáticamente
async function sendEmailWithLogging(
  emailType: string,
  emailData: EmailData,
  htmlContent: string,
  rentalId?: string,
  customerId?: string,
  customerName?: string
): Promise<boolean> {
  try {
    const result = await sendEmail(emailData);
    
    // Registrar log de email exitoso
    await logEmail(emailType, emailData, htmlContent, rentalId, customerId, 'sent', undefined, customerName);
    
    return result;
  } catch (error) {
    // Registrar log de email fallido
    await logEmail(emailType, emailData, htmlContent, rentalId, customerId, 'failed', error?.toString(), customerName);
    
    return false;
  }
}

// Email para creación de arriendo (estado: pendiente)
export async function sendRentalCreatedEmail(data: RentalEmailData): Promise<boolean> {
  const trackingUrl = generateTrackingUrl(data.trackingCode, data.trackingToken);
  
  const subject = `📋 Cotización Recibida - Código ${escapeHtmlServer(data.trackingCode)}`;
  
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>Cotización Recibida</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #2E5CA6 0%, #C8201D 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px;">📋 Cotización Recibida</h1>
        <p style="color: white; margin: 10px 0 0 0; font-size: 16px;">Tu código de seguimiento: <strong>${escapeHtmlServer(data.trackingCode)}</strong></p>
      </div>
      
      <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
        <h2 style="color: #2E5CA6; margin-top: 0;">Hola ${escapeHtmlServer(data.customerName)},</h2>
        
        <p>Hemos recibido tu solicitud de arriendo. Se encuentra en estado <strong>PENDIENTE</strong>. <span style="background: #fff3cd; padding: 2px 6px; border-radius: 3px; color: #856404;">Solo al pagar se confirma el arriendo</span> y puedes tener tus cajas aseguradas.</p>
        
        <!-- PRECIO TOTAL EN GRANDE -->
        <div style="background: linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%); padding: 25px; border-radius: 10px; margin: 20px 0; text-align: center;">
          <h2 style="color: white; margin: 0; font-size: 24px;">💰 PRECIO TOTAL</h2>
          <div style="color: white; font-size: 36px; font-weight: bold; margin: 10px 0;">
            $${(data.totalAmount || 0).toLocaleString('es-CL')}
          </div>
          <p style="color: #e8f5e8; margin: 0; font-size: 14px;">Precio final del arriendo</p>
        </div>

        <!-- DESGLOSE DE PRECIOS -->
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #4CAF50;">
          <h3 style="margin-top: 0; color: #4CAF50;">📊 Desglose de Precios</h3>
          <div style="border-bottom: 1px solid #eee; padding-bottom: 15px; margin-bottom: 15px;">
            <div style="display: flex; justify-content: space-between; margin: 8px 0;">
              <span><strong>Arriendo ${data.boxQuantity} cajas:</strong></span>
              <span style="font-weight: bold;">$${((data.totalAmount || 0) - (data.guaranteeAmount || 0) - (data.additionalProducts && data.additionalProducts.length > 0 ? data.additionalProducts.reduce((sum, product) => sum + (product.quantity * product.price), 0) : 0)).toLocaleString('es-CL')}</span>
            </div>
            ${data.additionalProducts && data.additionalProducts.length > 0 ? 
              data.additionalProducts.map(product => 
                `<div style="display: flex; justify-content: space-between; margin: 8px 0; color: #666;">
                  <span>${product.quantity}x ${escapeHtmlServer(product.name)}:</span>
                  <span>$${(product.quantity * product.price).toLocaleString('es-CL')}</span>
                </div>`
              ).join('') : ''
            }
            <div style="display: flex; justify-content: space-between; margin: 8px 0; color: #856404;">
              <span><strong>Garantía:</strong> <small>(se devuelve al entregar las cajas)</small></span>
              <span style="font-weight: bold;">$${(data.guaranteeAmount || 0).toLocaleString('es-CL')}</span>
            </div>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 18px; font-weight: bold; color: #2E5CA6;">
            <span>TOTAL A PAGAR:</span>
            <span>$${(data.totalAmount || 0).toLocaleString('es-CL')}</span>
          </div>
        </div>

        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2E5CA6;">
          <h3 style="margin-top: 0; color: #2E5CA6;">📦 Detalles del Arriendo</h3>
          <ul style="list-style: none; padding: 0;">
            <li style="margin: 8px 0;"><strong>Código:</strong> ${escapeHtmlServer(data.trackingCode)}</li>
            <li style="margin: 8px 0;"><strong>Cantidad:</strong> ${data.boxQuantity} cajas</li>
            <li style="margin: 8px 0;"><strong>Fecha de entrega:</strong> ${new Date(data.deliveryDate).toLocaleDateString('es-CL')}</li>
            <li style="margin: 8px 0;"><strong>Fecha de retiro:</strong> ${new Date(data.pickupDate).toLocaleDateString('es-CL')}</li>
            <li style="margin: 8px 0;"><strong>Dirección:</strong> ${escapeHtmlServer(data.deliveryAddress)}</li>
          </ul>
        </div>
        
        <div style="background: #f0f8ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #0066cc;">
          <h3 style="margin-top: 0; color: #0066cc;">💳 Formas de Pago</h3>
          
          <h4 style="color: #2E5CA6; margin-top: 15px;">🏦 Transferencia Bancaria</h4>
          <div style="background: white; padding: 15px; border-radius: 6px; margin: 10px 0;">
            <ul style="list-style: none; padding: 0; margin: 0;">
              <li style="margin: 5px 0;"><strong>Banco:</strong> Banco Estado</li>
              <li style="margin: 5px 0;"><strong>Cuenta Vista:</strong> 033670433426</li>
              <li style="margin: 5px 0;"><strong>RUT:</strong> 77.102.629-K</li>
              <li style="margin: 5px 0;"><strong>Titular:</strong> Arriendo Cajas SpA</li>
              <li style="margin: 5px 0;"><strong>Email:</strong> ventas@arriendocajas.cl</li>
            </ul>
          </div>
          
          <h4 style="color: #2E5CA6; margin-top: 15px;">💳 Pago con Tarjeta</h4>
          <p style="margin: 5px 0; font-size: 14px;">
            Envía un email a <strong>contacto@arriendocajas.cl</strong> solicitando el pago con tarjeta.<br>
            <span style="background: #fff3cd; padding: 2px 6px; border-radius: 3px; color: #856404; font-size: 13px;">
              * Tiene un 3% de recargo adicional
            </span>
          </p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${trackingUrl}" style="background: #C8201D; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
            🔍 Seguir mi Arriendo
          </a>
        </div>
        
        <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0; font-size: 14px; color: #1565c0;">
            💡 <strong>Consejo:</strong> Guarda este email y el código ${escapeHtmlServer(data.trackingCode)} para hacer seguimiento de tu arriendo en cualquier momento.
          </p>
        </div>
        
        <p style="margin-top: 30px;">
          Si tienes alguna consulta, no dudes en contactarnos:<br>
          ✉️ <strong>Email:</strong> contacto@arriendocajas.cl<br>
          💬 <strong>WhatsApp:</strong> <a href="https://wa.me/56987290995" style="color: #25D366; text-decoration: none;">+56 9 8729 0995</a>
        </p>
        
        <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
        <p style="text-align: center; color: #666; font-size: 12px;">
          © 2025 Arriendo Cajas. Todos los derechos reservados.<br>
          Este email fue enviado automáticamente, por favor no responder.
        </p>
      </div>
    </body>
    </html>
  `;

  return await sendEmailWithLogging('pending', {
    to: data.customerEmail,
    subject,
    html: htmlContent
  }, htmlContent, data.rentalId, data.customerId, data.customerName);
}

// Email recordatorio para arriendos pendientes (5 días antes)
export async function sendPendingReminderEmail(data: RentalEmailData): Promise<boolean> {
  const deliveryDate = new Date(data.deliveryDate).toLocaleDateString('es-CL', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const subject = `Tu arriendo está reservado para ${escapeHtmlServer(deliveryDate)}`;
  
  const basePrice = (data.totalAmount || 0) - (data.guaranteeAmount || 0) - 
    (data.additionalProducts && data.additionalProducts.length > 0 ? 
      data.additionalProducts.reduce((sum, product) => sum + (product.quantity * product.price), 0) : 0);

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>Tu arriendo está reservado</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 500px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #2E5CA6; margin: 0; font-size: 24px;">¡Hola ${escapeHtmlServer(data.customerName)}!</h1>
        <p style="color: #666; margin: 10px 0 0 0;">Te recordamos tu arriendo programado</p>
      </div>
      
      <div style="background: #f8f9fa; padding: 25px; border-radius: 8px; margin: 20px 0;">
        <div style="text-align: center; margin-bottom: 20px;">
          <div style="color: #C8201D; font-size: 18px; font-weight: bold;">📅 ${escapeHtmlServer(deliveryDate)}</div>
          <p style="margin: 5px 0 0 0; color: #666; font-size: 14px;">Fecha de entrega programada</p>
        </div>
        
        <div style="border-top: 1px solid #ddd; padding-top: 20px;">
          <div style="margin: 8px 0;">
            <span style="font-weight: bold;">📦 Cantidad:</span> ${data.boxQuantity} cajas
          </div>
          <div style="margin: 8px 0;">
            <span style="font-weight: bold;">📍 Dirección:</span> ${escapeHtmlServer(data.deliveryAddress)}
          </div>
          <div style="margin: 8px 0; padding: 10px; background: white; border-radius: 5px;">
            <span style="font-weight: bold; color: #2E5CA6;">💰 Total:</span> 
            <span style="font-size: 18px; font-weight: bold; color: #2E5CA6;">$${(data.totalAmount || 0).toLocaleString('es-CL')}</span>
          </div>
        </div>
      </div>

      <div style="background: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
        <p style="margin: 0; font-weight: bold; color: #856404;">
          ⏰ Solo necesitas confirmar el pago para asegurar tus cajas
        </p>
      </div>
      
      <div style="text-align: center; margin: 25px 0;">
        <p style="margin: 10px 0; color: #666;">¿Tienes dudas o quieres confirmar?</p>
        
        <div style="margin: 15px 0;">
          <a href="mailto:contacto@arriendocajas.cl" style="display: inline-block; background: #2E5CA6; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; margin: 5px;">
            ✉️ Responder Email
          </a>
        </div>
        
        <div style="margin: 15px 0;">
          <a href="https://wa.me/56987290995" style="display: inline-block; background: #25D366; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; margin: 5px;">
            💬 WhatsApp
          </a>
        </div>
      </div>
      
      <div style="text-align: center; border-top: 1px solid #ddd; padding-top: 20px; margin-top: 30px;">
        <p style="color: #666; font-size: 12px; margin: 0;">
          Arriendo Cajas - Código: ${escapeHtmlServer(data.trackingCode)}<br>
          Este email fue enviado automáticamente
        </p>
      </div>
    </body>
    </html>
  `;

  return await sendEmailWithLogging('pending_reminder', {
    to: data.customerEmail,
    subject,
    html: htmlContent
  }, htmlContent, data.rentalId, data.customerId, data.customerName);
}

// Email para arriendo pagado
export async function sendRentalPaidEmail(data: RentalEmailData): Promise<boolean> {
  const trackingUrl = generateTrackingUrl(data.trackingCode, data.trackingToken);
  
  const subject = `✅ Pago Confirmado - Arriendo ${escapeHtmlServer(data.trackingCode)}`;
  
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>Pago Confirmado</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px;">✅ ¡Pago Confirmado!</h1>
        <p style="color: white; margin: 10px 0 0 0; font-size: 16px;">Código: <strong>${escapeHtmlServer(data.trackingCode)}</strong></p>
      </div>
      
      <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
        <h2 style="color: #2E5CA6; margin-top: 0;">Hola ${escapeHtmlServer(data.customerName)},</h2>
        
        <p>¡Excelentes noticias! Tu pago ha sido confirmado y tu arriendo está <strong>ASEGURADO</strong>. Tus cajas están reservadas y listas para la entrega programada.</p>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #4CAF50;">
          <h3 style="margin-top: 0; color: #4CAF50;">📦 Arriendo Confirmado</h3>
          <ul style="list-style: none; padding: 0;">
            <li style="margin: 8px 0;"><strong>Código:</strong> ${escapeHtmlServer(data.trackingCode)}</li>
            <li style="margin: 8px 0;"><strong>Cantidad:</strong> ${data.boxQuantity} cajas</li>
            <li style="margin: 8px 0;"><strong>Fecha de entrega:</strong> ${new Date(data.deliveryDate).toLocaleDateString('es-CL')}</li>
            <li style="margin: 8px 0;"><strong>Fecha de retiro:</strong> ${new Date(data.pickupDate).toLocaleDateString('es-CL')}</li>
            <li style="margin: 8px 0;"><strong>Dirección:</strong> ${escapeHtmlServer(data.deliveryAddress)}</li>
          </ul>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${trackingUrl}" style="background: #C8201D; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
            🔍 Seguir mi Arriendo
          </a>
        </div>
        
        <div style="background: #e8f5e8; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0; font-size: 14px; color: #2e7d32;">
            ✅ <strong>¡Tu arriendo está confirmado!</strong> Pronto nos contactaremos para coordinar los detalles de la entrega.
          </p>
        </div>
        
        <p style="margin-top: 30px;">
          Si tienes alguna consulta, no dudes en contactarnos:<br>
          ✉️ <strong>Email:</strong> contacto@arriendocajas.cl<br>
          💬 <strong>WhatsApp:</strong> <a href="https://wa.me/56987290995" style="color: #25D366; text-decoration: none;">+56 9 8729 0995</a>
        </p>
      </div>
    </body>
    </html>
  `;

  return await sendEmailWithLogging('paid', {
    to: data.customerEmail,
    subject,
    html: htmlContent
  }, htmlContent, data.rentalId, data.customerId, data.customerName);
}

// Email para arriendo entregado
export async function sendRentalDeliveredEmail(data: RentalEmailData): Promise<boolean> {
  const trackingUrl = generateTrackingUrl(data.trackingCode, data.trackingToken);
  
  const subject = `✅ Cajas Entregadas - Código ${escapeHtmlServer(data.trackingCode)}`;
  
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>Cajas Entregadas</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px;">✅ ¡Cajas Entregadas!</h1>
        <p style="color: white; margin: 10px 0 0 0; font-size: 16px;">Código: <strong>${escapeHtmlServer(data.trackingCode)}</strong></p>
      </div>
      
      <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
        <h2 style="color: #2E5CA6; margin-top: 0;">Hola ${escapeHtmlServer(data.customerName)},</h2>
        
        <p>¡Perfecto! Tus ${data.boxQuantity} cajas han sido <strong>ENTREGADAS</strong> exitosamente.</p>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #4CAF50;">
          <h3 style="margin-top: 0; color: #4CAF50;">📦 Entrega Completada</h3>
          <ul style="list-style: none; padding: 0;">
            <li style="margin: 8px 0;"><strong>Cantidad entregada:</strong> ${data.boxQuantity} cajas</li>
            <li style="margin: 8px 0;"><strong>Fecha de retiro programada:</strong> ${new Date(data.pickupDate).toLocaleDateString('es-CL')}</li>
            <li style="margin: 8px 0;"><strong>Dirección:</strong> ${escapeHtmlServer(data.deliveryAddress)}</li>
          </ul>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${trackingUrl}" style="background: #C8201D; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
            🔍 Seguir mi Arriendo
          </a>
        </div>
        
        <div style="background: #e8f5e8; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h4 style="margin: 0 0 15px 0; color: #2e7d32; font-size: 16px;">💡 Consejos para aprovechar al máximo tus cajas:</h4>
          <ul style="margin: 0; padding-left: 20px; color: #2e7d32; font-size: 14px;">
            <li style="margin: 8px 0;"><strong>Protege tu espalda:</strong> Dobla las rodillas al levantar, no la espalda. Mantén la carga cerca del cuerpo.</li>
            <li style="margin: 8px 0;"><strong>Empaca inteligente:</strong> Los objetos pesados van abajo, los frágiles arriba y bien protegidos.</li>
            <li style="margin: 8px 0;"><strong>Etiqueta todo:</strong> Marca cada caja con su contenido y habitación de destino.</li>
            <li style="margin: 8px 0;"><strong>No sobrecargues:</strong> Máximo 20kg por caja para facilitar el transporte.</li>
            <li style="margin: 8px 0;"><strong>Usa papel o toallas:</strong> Para rellenar espacios vacíos y evitar que se muevan los objetos.</li>
          </ul>
          <div style="margin-top: 15px; padding: 10px; background: #f1f8e9; border-radius: 5px;">
            <p style="margin: 0; font-size: 13px; color: #2e7d32;">
              📋 <strong>Próximo paso:</strong> Recuerda tener las cajas listas para el retiro en la fecha programada.
            </p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendEmailWithLogging('delivered', {
    to: data.customerEmail,
    subject,
    html: htmlContent
  }, htmlContent, data.rentalId, data.customerId, data.customerName);
}

// Email para arriendo retirado
export async function sendRentalPickedUpEmail(data: RentalEmailData): Promise<boolean> {
  const trackingUrl = generateTrackingUrl(data.trackingCode, data.trackingToken);
  
  const subject = `📦 Cajas Retiradas - Código ${escapeHtmlServer(data.trackingCode)}`;
  
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>Cajas Retiradas</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #FF9800 0%, #F57C00 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px;">📦 Cajas Retiradas</h1>
        <p style="color: white; margin: 10px 0 0 0; font-size: 16px;">Código: <strong>${escapeHtmlServer(data.trackingCode)}</strong></p>
      </div>
      
      <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
        <h2 style="color: #2E5CA6; margin-top: 0;">Hola ${escapeHtmlServer(data.customerName)},</h2>
        
        <p>Las ${data.boxQuantity} cajas han sido <strong>RETIRADAS</strong> exitosamente. El arriendo está casi finalizado.</p>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #FF9800;">
          <h3 style="margin-top: 0; color: #FF9800;">🚚 Retiro Completado</h3>
          <ul style="list-style: none; padding: 0;">
            <li style="margin: 8px 0;"><strong>Cantidad retirada:</strong> ${data.boxQuantity} cajas</li>
            <li style="margin: 8px 0;"><strong>Estado:</strong> Procesando devolución de garantía</li>
          </ul>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${trackingUrl}" style="background: #C8201D; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
            🔍 Seguir mi Arriendo
          </a>
        </div>
        
        <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0; font-size: 14px; color: #856404;">
            ⏳ <strong>Próximo paso:</strong> Pronto recibirás la confirmación de devolución de la garantía.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendEmailWithLogging('picked_up', {
    to: data.customerEmail,
    subject,
    html: htmlContent
  }, htmlContent, data.rentalId, data.customerId, data.customerName);
}

// Email para arriendo en ruta 
export async function sendRentalOnRouteEmail(data: RentalEmailData): Promise<boolean> {
  const trackingUrl = generateTrackingUrl(data.trackingCode, data.trackingToken);
  const estimatedTime = "30-45 minutos";
  
  const subject = `🚚 ¡Vamos en camino! - Código ${escapeHtmlServer(data.trackingCode)}`;
  
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>¡Vamos en Camino!</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #2E5CA6 0%, #4CAF50 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px;">🚚 ¡Vamos en Camino!</h1>
        <p style="color: white; margin: 10px 0 0 0; font-size: 16px;">Tu repartidor está en ruta - Código: <strong>${escapeHtmlServer(data.trackingCode)}</strong></p>
      </div>
      
      <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
        <h2 style="color: #2E5CA6; margin-top: 0;">¡Hola ${escapeHtmlServer(data.customerName)}!</h2>
        
        <p>¡Buenas noticias! Nuestro repartidor ya está <strong>EN CAMINO</strong> hacia tu dirección con las <strong>${data.boxQuantity} cajas</strong> que solicitaste. 🎉</p>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2E5CA6;">
          <h3 style="margin-top: 0; color: #2E5CA6;">👤 Tu repartidor:</h3>
          <ul style="list-style: none; padding: 0;">
            <li style="margin: 8px 0;"><strong>Nombre:</strong> ${escapeHtmlServer(data.driverName || 'Por confirmar')}</li>
            <li style="margin: 8px 0;"><strong>Teléfono:</strong> ${escapeHtmlServer(data.driverPhone || 'Por confirmar')}</li>
            <li style="margin: 8px 0;"><strong>Tiempo estimado:</strong> ${estimatedTime}</li>
          </ul>
        </div>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #333;">📦 Detalles de tu entrega:</h3>
          <ul style="list-style: none; padding: 0;">
            <li style="margin: 8px 0;"><strong>Cantidad:</strong> ${data.boxQuantity} cajas</li>
            <li style="margin: 8px 0;"><strong>Dirección:</strong> ${escapeHtmlServer(data.deliveryAddress)}</li>
          </ul>
        </div>
        
        <div style="background: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #856404;">💡 Prepárate para la entrega:</h3>
          <ul style="list-style: none; padding: 0;">
            <li style="margin: 8px 0;">✓ Ten tu <strong>teléfono disponible</strong> por si necesita contactarte</li>
            <li style="margin: 8px 0;">✓ Prepara el <strong>pago exacto</strong> según lo acordado</li>
            <li style="margin: 8px 0;">✓ Despeja el <strong>espacio de entrega</strong> para las cajas</li>
            <li style="margin: 8px 0;">✓ Si no estás, asegúrate de que alguien pueda recibir</li>
          </ul>
        </div>
        
        <div style="background: #e8f5e8; padding: 15px; border-radius: 8px; margin: 20px 0; text-align: center;">
          <p style="margin: 0; font-size: 16px; color: #2e7d32; font-weight: bold;">
            📞 El repartidor te contactará al llegar a tu dirección
          </p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${trackingUrl}" style="background: #C8201D; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
            🔍 Seguir mi Arriendo
          </a>
        </div>
        
        <p style="margin-top: 30px;">
          Si tienes alguna consulta, no dudes en contactarnos:<br>
          ✉️ <strong>Email:</strong> contacto@arriendocajas.cl<br>
          💬 <strong>WhatsApp:</strong> <a href="https://wa.me/56987290995" style="color: #25D366; text-decoration: none;">+56 9 8729 0995</a>
        </p>
        
        <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
        <p style="text-align: center; color: #666; font-size: 12px;">
          © 2025 Arriendo Cajas. Todos los derechos reservados.<br>
          Tu repartidor llega pronto con tus cajas.
        </p>
      </div>
    </body>
    </html>
  `;

  return await sendEmailWithLogging('on_route', {
    to: data.customerEmail,
    subject,
    html: htmlContent
  }, htmlContent, data.rentalId, data.customerId, data.customerName);
}

// Email para arriendo finalizado (con solicitud de review)
export async function sendRentalCompletedEmail(data: RentalEmailData): Promise<boolean> {
  const trackingUrl = generateTrackingUrl(data.trackingCode, data.trackingToken);
  const googleReviewUrl = 'https://g.page/r/CUv8pKvyA5WbEAE/review';
  
  const subject = `🎉 Arriendo Finalizado - Código ${escapeHtmlServer(data.trackingCode)}`;
  
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>Arriendo Finalizado</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #4CAF50 0%, #8BC34A 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px;">🎉 ¡Arriendo Finalizado!</h1>
        <p style="color: white; margin: 10px 0 0 0; font-size: 16px;">Código: <strong>${escapeHtmlServer(data.trackingCode)}</strong></p>
      </div>
      
      <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
        <h2 style="color: #2E5CA6; margin-top: 0;">¡Gracias ${escapeHtmlServer(data.customerName)}!</h2>
        
        <p>Tu arriendo ha sido <strong>FINALIZADO</strong> exitosamente. La garantía será devuelta según el método de pago original.</p>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #4CAF50;">
          <h3 style="margin-top: 0; color: #4CAF50;">✅ Arriendo Completado</h3>
          <ul style="list-style: none; padding: 0;">
            <li style="margin: 8px 0;"><strong>Cantidad:</strong> ${data.boxQuantity} cajas</li>
            <li style="margin: 8px 0;"><strong>Estado:</strong> FINALIZADO</li>
            <li style="margin: 8px 0;"><strong>Garantía:</strong> En proceso de devolución</li>
          </ul>
        </div>
        
        <div style="background: #e8f5e8; padding: 20px; border-radius: 8px; margin: 30px 0; text-align: center;">
          <h3 style="margin-top: 0; color: #2e7d32;">⭐ ¿Quedaste satisfecho con nuestro servicio?</h3>
          <p style="margin: 10px 0;">Nos encantaría conocer tu experiencia. Tu opinión nos ayuda a mejorar.</p>
          
          <a href="${googleReviewUrl}" target="_blank" style="background: #4CAF50; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block; margin: 10px 0;">
            ⭐ Dejar Reseña en Google
          </a>
          
          <p style="font-size: 12px; color: #666; margin: 10px 0 0 0;">
            Al dejar tu reseña, aceleras el proceso de devolución de la garantía
          </p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${trackingUrl}" style="background: #C8201D; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
            🔍 Ver Resumen Final
          </a>
        </div>
        
        <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0; font-size: 14px; color: #1565c0;">
            💰 <strong>Devolución de Garantía:</strong> Se procesará en las próximas 24-48 horas hábiles.
          </p>
        </div>
        
        <p style="margin-top: 30px;">
          ¡Esperamos verte pronto para tu próximo arriendo!<br><br>
          
          Si tienes alguna consulta, no dudes en contactarnos:<br>
          ✉️ <strong>Email:</strong> contacto@arriendocajas.cl<br>
          💬 <strong>WhatsApp:</strong> <a href="https://wa.me/56987290995" style="color: #25D366; text-decoration: none;">+56 9 8729 0995</a>
        </p>
        
        <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
        <p style="text-align: center; color: #666; font-size: 12px;">
          © 2025 Arriendo Cajas. Todos los derechos reservados.<br>
          Gracias por confiar en nosotros para tu mudanza.
        </p>
      </div>
    </body>
    </html>
  `;

  return await sendEmailWithLogging('completed', {
    to: data.customerEmail,
    subject,
    html: htmlContent
  }, htmlContent, data.rentalId, data.customerId, data.customerName);
}

// FUNCIONES DE PREVISUALIZACIÓN (solo generan HTML sin enviar)

// Datos de ejemplo para previsualizaciones
const SAMPLE_DATA: RentalEmailData = {
  customerName: 'María González',
  customerEmail: 'maria.gonzalez@email.com',
  trackingCode: 'AC240912',
  trackingToken: 'XY5Z9K',
  boxQuantity: 15,
  deliveryDate: '2024-09-15',
  pickupDate: '2024-09-22',
  deliveryAddress: 'Av. Providencia 1234, Providencia, Santiago',
  driverName: 'Carlos Martínez',
  driverPhone: '+56 9 8765 4321',
  status: 'pendiente',
  totalAmount: 45000,
  baseRentalPrice: 30000,
  guaranteeAmount: 10000,
  additionalProducts: [
    { name: 'Carrito plegable', quantity: 1, price: 15000 },
    { name: 'Correa Ratchet', quantity: 2, price: 6000 }
  ],
  rentalId: 'sample-123',
  customerId: 'customer-456'
};

export function generateEmailPreview(emailType: string): { subject: string; htmlContent: string } {
  const data = SAMPLE_DATA;
  const trackingUrl = generateTrackingUrl(data.trackingCode, data.trackingToken);

  switch (emailType) {
    case 'pendiente':
      return {
        subject: `📋 Cotización Recibida - Código ${escapeHtmlServer(data.trackingCode)}`,
        htmlContent: generatePendingEmailHTML(data, trackingUrl)
      };
    case 'pending_reminder':
      return {
        subject: `⏰ Recordatorio: Tu cotización está pendiente - ${escapeHtmlServer(data.trackingCode)}`,
        htmlContent: generatePendingReminderHTML(data, trackingUrl)
      };
    case 'pagado':
      return {
        subject: `✅ ¡Pago Confirmado! - Código ${escapeHtmlServer(data.trackingCode)}`,
        htmlContent: generatePaidEmailHTML(data, trackingUrl)
      };
    case 'en_ruta':
      return {
        subject: `🚚 Tu repartidor va en camino - ${escapeHtmlServer(data.trackingCode)}`,
        htmlContent: generateOnRouteEmailHTML(data, trackingUrl)
      };
    case 'entregada':
      return {
        subject: `📦 ¡Cajas entregadas! - Código ${escapeHtmlServer(data.trackingCode)}`,
        htmlContent: generateDeliveredEmailHTML(data, trackingUrl)
      };
    case 'retirada':
      return {
        subject: `✅ Cajas retiradas - Devolución de garantía - ${escapeHtmlServer(data.trackingCode)}`,
        htmlContent: generatePickedUpEmailHTML(data, trackingUrl)
      };
    case 'finalizada':
      return {
        subject: `🎉 ¡Arriendo completado! Ayúdanos con una reseña - ${escapeHtmlServer(data.trackingCode)}`,
        htmlContent: generateCompletedEmailHTML(data, trackingUrl)
      };
    default:
      return {
        subject: 'Template no encontrado',
        htmlContent: '<p>Tipo de email no válido</p>'
      };
  }
}

// Funciones auxiliares para generar HTML (extraídas de las funciones existentes)
function generatePendingEmailHTML(data: RentalEmailData, trackingUrl: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>Cotización Recibida</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #2E5CA6 0%, #C8201D 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px;">📋 Cotización Recibida</h1>
        <p style="color: white; margin: 10px 0 0 0; font-size: 16px;">Tu código de seguimiento: <strong>${escapeHtmlServer(data.trackingCode)}</strong></p>
      </div>
      
      <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
        <h2 style="color: #2E5CA6; margin-top: 0;">Hola ${escapeHtmlServer(data.customerName)},</h2>
        
        <p>Hemos recibido tu solicitud de arriendo. Se encuentra en estado <strong>PENDIENTE</strong>. <span style="background: #fff3cd; padding: 2px 6px; border-radius: 3px; color: #856404;">Solo al pagar se confirma el arriendo</span> y puedes tener tus cajas aseguradas.</p>
        
        <!-- PRECIO TOTAL EN GRANDE -->
        <div style="background: linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%); padding: 25px; border-radius: 10px; margin: 20px 0; text-align: center;">
          <h2 style="color: white; margin: 0; font-size: 24px;">💰 PRECIO TOTAL</h2>
          <div style="color: white; font-size: 36px; font-weight: bold; margin: 10px 0;">
            $${(data.totalAmount || 0).toLocaleString('es-CL')}
          </div>
          <p style="color: #e8f5e8; margin: 0; font-size: 14px;">Precio final del arriendo</p>
        </div>

        <!-- DESGLOSE DE PRECIOS -->
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #4CAF50;">
          <h3 style="margin-top: 0; color: #4CAF50;">📊 Desglose de Precios</h3>
          <div style="border-bottom: 1px solid #eee; padding-bottom: 15px; margin-bottom: 15px;">
            <div style="display: flex; justify-content: space-between; margin: 8px 0;">
              <span><strong>Arriendo ${data.boxQuantity} cajas:</strong></span>
              <span><strong>$${(data.baseRentalPrice || 0).toLocaleString('es-CL')}</strong></span>
            </div>
            <div style="display: flex; justify-content: space-between; margin: 8px 0;">
              <span><strong>Garantía (reembolsable):</strong></span>
              <span><strong>$${(data.guaranteeAmount || 0).toLocaleString('es-CL')}</strong></span>
            </div>
            ${data.additionalProducts?.map(product => `
              <div style="display: flex; justify-content: space-between; margin: 8px 0;">
                <span>${escapeHtmlServer(product.name)} (${product.quantity}):</span>
                <span>$${product.price.toLocaleString('es-CL')}</span>
              </div>
            `).join('') || ''}
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 18px; font-weight: bold; color: #4CAF50;">
            <span>TOTAL:</span>
            <span>$${(data.totalAmount || 0).toLocaleString('es-CL')}</span>
          </div>
        </div>
        
        <!-- DETALLES DEL ARRIENDO -->
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2E5CA6;">
          <h3 style="margin-top: 0; color: #2E5CA6;">📋 Detalles del Arriendo</h3>
          <div style="margin: 10px 0;"><strong>📦 Cantidad:</strong> ${data.boxQuantity} cajas</div>
          <div style="margin: 10px 0;"><strong>📅 Entrega:</strong> ${data.deliveryDate}</div>
          <div style="margin: 10px 0;"><strong>📅 Retiro:</strong> ${data.pickupDate}</div>
          <div style="margin: 10px 0;"><strong>📍 Dirección:</strong> ${escapeHtmlServer(data.deliveryAddress)}</div>
        </div>
        
        <!-- INSTRUCCIONES DE PAGO -->
        <div style="background: #e3f2fd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #1976d2;">
          <h3 style="margin-top: 0; color: #1976d2;">💳 Instrucciones de Pago</h3>
          <p style="margin: 0;">Para confirmar tu arriendo, realiza la transferencia por el monto total y envíanos el comprobante por WhatsApp.</p>
        </div>
        
        <!-- BOTÓN DE SEGUIMIENTO -->
        <div style="text-align: center; margin: 30px 0;">
          <a href="${trackingUrl}" style="background: linear-gradient(135deg, #2E5CA6 0%, #C8201D 100%); color: white; text-decoration: none; padding: 15px 30px; border-radius: 25px; font-weight: bold; display: inline-block;">
            🔍 Seguir mi Arriendo
          </a>
        </div>
        
        <!-- CONTACTO -->
        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
          <p style="margin: 5px 0;">Si tienes alguna consulta, no dudes en contactarnos:</p>
          <p style="margin: 5px 0;">✉️ <strong>Email:</strong> contacto@arriendocajas.cl</p>
          <p style="margin: 5px 0;">💬 <strong>WhatsApp:</strong> <a href="https://wa.me/56987290995" style="color: #25D366; text-decoration: none;">+56 9 8729 0995</a></p>
        </div>
      </div>
    </body>
    </html>
  `;
}

function generatePendingReminderHTML(data: RentalEmailData, trackingUrl: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>Recordatorio - Pago Pendiente</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #ff9800 0%, #e65100 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px;">⏰ Recordatorio de Pago</h1>
        <p style="color: white; margin: 10px 0 0 0; font-size: 16px;">Tu cotización está esperando confirmación</p>
      </div>
      
      <div style="background: #fff8e1; padding: 30px; border-radius: 0 0 10px 10px;">
        <h2 style="color: #e65100; margin-top: 0;">Hola ${escapeHtmlServer(data.customerName)},</h2>
        
        <p>Tu cotización <strong>${escapeHtmlServer(data.trackingCode)}</strong> está pendiente de pago desde hace 5 días. ¡No pierdas tu fecha de entrega programada!</p>
        
        <div style="background: linear-gradient(135deg, #ff5722 0%, #d84315 100%); padding: 25px; border-radius: 10px; margin: 20px 0; text-align: center;">
          <h2 style="color: white; margin: 0; font-size: 24px;">💰 MONTO A PAGAR</h2>
          <div style="color: white; font-size: 36px; font-weight: bold; margin: 10px 0;">
            $${(data.totalAmount || 0).toLocaleString('es-CL')}
          </div>
          <p style="color: #ffccbc; margin: 0; font-size: 14px;">Entrega programada: ${data.deliveryDate}</p>
        </div>
        
        <div style="background: #fff3e0; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ff9800;">
          <h3 style="margin-top: 0; color: #ef6c00;">🚀 ¡Actúa Rápido!</h3>
          <p style="margin: 0;">Confirma tu pago hoy para asegurar:</p>
          <ul style="margin: 10px 0;">
            <li>✅ Tu fecha de entrega del <strong>${data.deliveryDate}</strong></li>
            <li>✅ Disponibilidad de las ${data.boxQuantity} cajas</li>
            <li>✅ Precio bloqueado sin cambios</li>
          </ul>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${trackingUrl}" style="background: linear-gradient(135deg, #ff5722 0%, #d84315 100%); color: white; text-decoration: none; padding: 15px 30px; border-radius: 25px; font-weight: bold; display: inline-block;">
            💳 Confirmar Pago Ahora
          </a>
        </div>
        
        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
          <p style="margin: 5px 0;">Si tienes alguna consulta, no dudes en contactarnos:</p>
          <p style="margin: 5px 0;">✉️ <strong>Email:</strong> contacto@arriendocajas.cl</p>
          <p style="margin: 5px 0;">💬 <strong>WhatsApp:</strong> <a href="https://wa.me/56987290995" style="color: #25D366; text-decoration: none;">+56 9 8729 0995</a></p>
        </div>
      </div>
    </body>
    </html>
  `;
}

function generatePaidEmailHTML(data: RentalEmailData, trackingUrl: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>Pago Confirmado</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px;">✅ ¡Pago Confirmado!</h1>
        <p style="color: white; margin: 10px 0 0 0; font-size: 16px;">Tu arriendo está confirmado - ${escapeHtmlServer(data.trackingCode)}</p>
      </div>
      
      <div style="background: #f1f8e9; padding: 30px; border-radius: 0 0 10px 10px;">
        <h2 style="color: #2E7D32; margin-top: 0;">¡Excelente ${escapeHtmlServer(data.customerName)}!</h2>
        
        <p>Tu pago ha sido confirmado exitosamente. Tu arriendo está <strong>CONFIRMADO</strong> y las cajas están reservadas para ti.</p>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #4CAF50;">
          <h3 style="margin-top: 0; color: #4CAF50;">📦 Resumen del Arriendo</h3>
          <div style="margin: 10px 0;"><strong>📦 Cantidad:</strong> ${data.boxQuantity} cajas</div>
          <div style="margin: 10px 0;"><strong>📅 Entrega:</strong> ${data.deliveryDate}</div>
          <div style="margin: 10px 0;"><strong>📅 Retiro:</strong> ${data.pickupDate}</div>
          <div style="margin: 10px 0;"><strong>📍 Dirección:</strong> ${escapeHtmlServer(data.deliveryAddress)}</div>
          <div style="margin: 10px 0;"><strong>💰 Total pagado:</strong> $${(data.totalAmount || 0).toLocaleString('es-CL')}</div>
        </div>
        
        <div style="background: #e8f5e8; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #2E7D32;">📋 Próximos Pasos</h3>
          <ol style="margin: 0; padding-left: 20px;">
            <li style="margin: 8px 0;">Prepararemos tus cajas para la entrega</li>
            <li style="margin: 8px 0;">Te asignaremos un repartidor y recibirás sus datos</li>
            <li style="margin: 8px 0;">El día de entrega recibirás notificación cuando vaya en camino</li>
          </ol>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${trackingUrl}" style="background: linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%); color: white; text-decoration: none; padding: 15px 30px; border-radius: 25px; font-weight: bold; display: inline-block;">
            🔍 Seguir mi Arriendo
          </a>
        </div>
        
        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
          <p style="margin: 5px 0;">Si tienes alguna consulta, no dudes en contactarnos:</p>
          <p style="margin: 5px 0;">✉️ <strong>Email:</strong> contacto@arriendocajas.cl</p>
          <p style="margin: 5px 0;">💬 <strong>WhatsApp:</strong> <a href="https://wa.me/56987290995" style="color: #25D366; text-decoration: none;">+56 9 8729 0995</a></p>
        </div>
      </div>
    </body>
    </html>
  `;
}

function generateOnRouteEmailHTML(data: RentalEmailData, trackingUrl: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>Repartidor en Camino</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #2196F3 0%, #1565C0 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px;">🚚 ¡Tu repartidor va en camino!</h1>
        <p style="color: white; margin: 10px 0 0 0; font-size: 16px;">Código: ${escapeHtmlServer(data.trackingCode)}</p>
      </div>
      
      <div style="background: #e3f2fd; padding: 30px; border-radius: 0 0 10px 10px;">
        <h2 style="color: #1565C0; margin-top: 0;">Hola ${escapeHtmlServer(data.customerName)},</h2>
        
        <p>¡Buenas noticias! Tu repartidor ya salió y se dirige hacia tu dirección de entrega.</p>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2196F3;">
          <h3 style="margin-top: 0; color: #2196F3;">👨‍🚚 Datos del Repartidor</h3>
          <div style="margin: 10px 0;"><strong>Conductor:</strong> ${escapeHtmlServer(data.driverName || 'Por asignar')}</div>
          <div style="margin: 10px 0;"><strong>Teléfono:</strong> ${escapeHtmlServer(data.driverPhone || 'Por confirmar')}</div>
          <div style="margin: 10px 0;"><strong>Tiempo estimado:</strong> 30-60 minutos</div>
        </div>
        
        <div style="background: #fff3e0; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ff9800;">
          <h3 style="margin-top: 0; color: #ef6c00;">📋 Prepárate para la Entrega</h3>
          <ul style="margin: 10px 0; padding-left: 20px;">
            <li>Asegúrate de estar disponible en: <strong>${escapeHtmlServer(data.deliveryAddress)}</strong></li>
            <li>Ten un espacio preparado para las ${data.boxQuantity} cajas</li>
            <li>El repartidor te llamará al llegar</li>
          </ul>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${trackingUrl}" style="background: linear-gradient(135deg, #2196F3 0%, #1565C0 100%); color: white; text-decoration: none; padding: 15px 30px; border-radius: 25px; font-weight: bold; display: inline-block;">
            🔍 Seguir Entrega
          </a>
        </div>
        
        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
          <p style="margin: 5px 0;">Si tienes alguna consulta, no dudes en contactarnos:</p>
          <p style="margin: 5px 0;">✉️ <strong>Email:</strong> contacto@arriendocajas.cl</p>
          <p style="margin: 5px 0;">💬 <strong>WhatsApp:</strong> <a href="https://wa.me/56987290995" style="color: #25D366; text-decoration: none;">+56 9 8729 0995</a></p>
        </div>
      </div>
    </body>
    </html>
  `;
}

function generateDeliveredEmailHTML(data: RentalEmailData, trackingUrl: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>Cajas Entregadas</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px;">📦 ¡Cajas entregadas!</h1>
        <p style="color: white; margin: 10px 0 0 0; font-size: 16px;">Tu arriendo ${escapeHtmlServer(data.trackingCode)} está activo</p>
      </div>
      
      <div style="background: #f1f8e9; padding: 30px; border-radius: 0 0 10px 10px;">
        <h2 style="color: #2E7D32; margin-top: 0;">¡Perfecto ${escapeHtmlServer(data.customerName)}!</h2>
        
        <p>Tus ${data.boxQuantity} cajas han sido entregadas exitosamente. ¡Ya puedes usar tus cajas para tu mudanza!</p>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #4CAF50;">
          <h3 style="margin-top: 0; color: #4CAF50;">📅 Información del Retiro</h3>
          <div style="margin: 10px 0;"><strong>Fecha de retiro programada:</strong> ${data.pickupDate}</div>
          <div style="margin: 10px 0;"><strong>Dirección de retiro:</strong> ${escapeHtmlServer(data.deliveryAddress)}</div>
          <div style="margin: 10px 0;"><strong>Te contactaremos:</strong> 1-2 días antes del retiro</div>
        </div>
        
        <div style="background: #fff3e0; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ff9800;">
          <h3 style="margin-top: 0; color: #ef6c00;">📋 Consejos Importantes</h3>
          <ul style="margin: 10px 0; padding-left: 20px;">
            <li>Cuida las cajas durante tu mudanza</li>
            <li>Mantenlas secas y en buen estado</li>
            <li>Limpia cualquier residuo antes del retiro</li>
            <li>Ten las cajas listas para el día de retiro</li>
          </ul>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${trackingUrl}" style="background: linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%); color: white; text-decoration: none; padding: 15px 30px; border-radius: 25px; font-weight: bold; display: inline-block;">
            🔍 Ver mi Arriendo
          </a>
        </div>
        
        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
          <p style="margin: 5px 0;">Si tienes alguna consulta, no dudes en contactarnos:</p>
          <p style="margin: 5px 0;">✉️ <strong>Email:</strong> contacto@arriendocajas.cl</p>
          <p style="margin: 5px 0;">💬 <strong>WhatsApp:</strong> <a href="https://wa.me/56987290995" style="color: #25D366; text-decoration: none;">+56 9 8729 0995</a></p>
        </div>
      </div>
    </body>
    </html>
  `;
}

function generatePickedUpEmailHTML(data: RentalEmailData, trackingUrl: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>Cajas Retiradas - Devolución de Garantía</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #9C27B0 0%, #6A1B9A 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px;">✅ Cajas retiradas exitosamente</h1>
        <p style="color: white; margin: 10px 0 0 0; font-size: 16px;">Procesando devolución de garantía</p>
      </div>
      
      <div style="background: #f3e5f5; padding: 30px; border-radius: 0 0 10px 10px;">
        <h2 style="color: #6A1B9A; margin-top: 0;">¡Gracias ${escapeHtmlServer(data.customerName)}!</h2>
        
        <p>Hemos retirado exitosamente las ${data.boxQuantity} cajas de tu arriendo <strong>${escapeHtmlServer(data.trackingCode)}</strong>.</p>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #9C27B0;">
          <h3 style="margin-top: 0; color: #9C27B0;">💰 Devolución de Garantía</h3>
          <div style="margin: 10px 0;"><strong>Monto a devolver:</strong> $${(data.guaranteeAmount || 0).toLocaleString('es-CL')}</div>
          <div style="margin: 10px 0;"><strong>Estado:</strong> <span style="color: #4CAF50;">En proceso</span></div>
          <div style="margin: 10px 0;"><strong>Tiempo estimado:</strong> 1-3 días hábiles</div>
        </div>
        
        <div style="background: #e1f5fe; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2196F3;">
          <h3 style="margin-top: 0; color: #1976d2;">📋 Datos Bancarios</h3>
          <p style="margin: 0;">Para procesar la devolución, necesitamos que nos envíes por WhatsApp:</p>
          <ul style="margin: 10px 0; padding-left: 20px;">
            <li>Nombre completo del titular</li>
            <li>RUT del titular</li>
            <li>Banco</li>
            <li>Tipo de cuenta (corriente/ahorro)</li>
            <li>Número de cuenta</li>
          </ul>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="https://wa.me/56987290995" style="background: linear-gradient(135deg, #25D366 0%, #1BAE42 100%); color: white; text-decoration: none; padding: 15px 30px; border-radius: 25px; font-weight: bold; display: inline-block;">
            💬 Enviar Datos Bancarios
          </a>
        </div>
        
        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
          <p style="margin: 5px 0;">Si tienes alguna consulta, no dudes en contactarnos:</p>
          <p style="margin: 5px 0;">✉️ <strong>Email:</strong> contacto@arriendocajas.cl</p>
          <p style="margin: 5px 0;">💬 <strong>WhatsApp:</strong> <a href="https://wa.me/56987290995" style="color: #25D366; text-decoration: none;">+56 9 8729 0995</a></p>
        </div>
      </div>
    </body>
    </html>
  `;
}

function generateCompletedEmailHTML(data: RentalEmailData, trackingUrl: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>Arriendo Completado - Ayúdanos con una Reseña</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #FF9800 0%, #F57C00 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px;">🎉 ¡Arriendo completado!</h1>
        <p style="color: white; margin: 10px 0 0 0; font-size: 16px;">Gracias por confiar en nosotros</p>
      </div>
      
      <div style="background: #fff8e1; padding: 30px; border-radius: 0 0 10px 10px;">
        <h2 style="color: #F57C00; margin-top: 0;">¡Muchas gracias ${escapeHtmlServer(data.customerName)}!</h2>
        
        <p>Tu arriendo <strong>${escapeHtmlServer(data.trackingCode)}</strong> ha sido completado exitosamente. Esperamos que nuestro servicio haya sido de gran ayuda en tu mudanza.</p>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #FF9800;">
          <h3 style="margin-top: 0; color: #FF9800;">⭐ ¿Te gustaría ayudarnos?</h3>
          <p style="margin: 0;">Tu opinión es muy valiosa para nosotros. Si estás conforme con el servicio, nos ayudarías muchísimo dejando una reseña en Google Maps.</p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="https://maps.google.com/search/arriendo+cajas+chile" style="background: linear-gradient(135deg, #4285F4 0%, #1565C0 100%); color: white; text-decoration: none; padding: 15px 30px; border-radius: 25px; font-weight: bold; display: inline-block;">
            ⭐ Dejar Reseña en Google
          </a>
        </div>
        
        <div style="background: #e8f5e8; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #2E7D32;">🔄 ¿Necesitas cajas nuevamente?</h3>
          <p style="margin: 0;">¡Estaremos encantados de ayudarte en tu próxima mudanza! Contáctanos cuando lo necesites.</p>
        </div>
        
        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
          <p style="margin: 5px 0;">Si tienes alguna consulta, no dudes en contactarnos:</p>
          <p style="margin: 5px 0;">✉️ <strong>Email:</strong> contacto@arriendocajas.cl</p>
          <p style="margin: 5px 0;">💬 <strong>WhatsApp:</strong> <a href="https://wa.me/56987290995" style="color: #25D366; text-decoration: none;">+56 9 8729 0995</a></p>
        </div>
      </div>
    </body>
    </html>
  `;
}

// Función helper para enviar email según el estado
export async function sendStatusChangeEmail(
  status: string,
  data: RentalEmailData
): Promise<boolean> {
  switch (status) {
    case 'pendiente':
      return await sendRentalCreatedEmail(data);
    case 'pagado':
      return await sendRentalPaidEmail(data);
    case 'entregada':
      return await sendRentalDeliveredEmail(data);
    case 'retirada':
      return await sendRentalPickedUpEmail(data);
    case 'en_ruta':
      return await sendRentalOnRouteEmail(data);
    case 'finalizada':
      return await sendRentalCompletedEmail(data);
    default:
      console.log(`No email template for status: ${status}`);
      return false;
  }
}