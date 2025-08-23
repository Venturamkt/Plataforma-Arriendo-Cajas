import { sendEmail, type EmailData } from './emailService';
import { generateTrackingUrl } from './trackingUtils';

interface RentalEmailData {
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
}

// Email para creación de arriendo (estado: pendiente)
export async function sendRentalCreatedEmail(data: RentalEmailData): Promise<boolean> {
  const trackingUrl = generateTrackingUrl(data.trackingCode, data.trackingToken);
  
  const subject = `📋 Cotización Recibida - Código ${data.trackingCode}`;
  
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
        <p style="color: white; margin: 10px 0 0 0; font-size: 16px;">Tu código de seguimiento: <strong>${data.trackingCode}</strong></p>
      </div>
      
      <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
        <h2 style="color: #2E5CA6; margin-top: 0;">Hola ${data.customerName},</h2>
        
        <p>Hemos recibido tu solicitud de arriendo. Se encuentra en estado <strong>PENDIENTE</strong>. <span style="background: #fff3cd; padding: 2px 6px; border-radius: 3px; color: #856404;">Solo al pagar se confirma el arriendo</span> y puedes tener tus cajas aseguradas.</p>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2E5CA6;">
          <h3 style="margin-top: 0; color: #2E5CA6;">📦 Detalles del Arriendo</h3>
          <ul style="list-style: none; padding: 0;">
            <li style="margin: 8px 0;"><strong>Código:</strong> ${data.trackingCode}</li>
            <li style="margin: 8px 0;"><strong>Cantidad:</strong> ${data.boxQuantity} cajas</li>
            <li style="margin: 8px 0;"><strong>Fecha de entrega:</strong> ${new Date(data.deliveryDate).toLocaleDateString('es-CL')}</li>
            <li style="margin: 8px 0;"><strong>Fecha de retiro:</strong> ${new Date(data.pickupDate).toLocaleDateString('es-CL')}</li>
            <li style="margin: 8px 0;"><strong>Dirección:</strong> ${data.deliveryAddress}</li>
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
            💡 <strong>Consejo:</strong> Guarda este email y el código ${data.trackingCode} para hacer seguimiento de tu arriendo en cualquier momento.
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

  return await sendEmail({
    to: data.customerEmail,
    subject,
    html: htmlContent
  });
}

// Email para arriendo pagado
export async function sendRentalPaidEmail(data: RentalEmailData): Promise<boolean> {
  const trackingUrl = generateTrackingUrl(data.trackingCode, data.trackingToken);
  
  const subject = `✅ Pago Confirmado - Arriendo ${data.trackingCode}`;
  
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
        <p style="color: white; margin: 10px 0 0 0; font-size: 16px;">Código: <strong>${data.trackingCode}</strong></p>
      </div>
      
      <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
        <h2 style="color: #2E5CA6; margin-top: 0;">Hola ${data.customerName},</h2>
        
        <p>¡Excelentes noticias! Tu pago ha sido confirmado y tu arriendo está <strong>ASEGURADO</strong>. Tus cajas están reservadas y listas para la entrega programada.</p>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #4CAF50;">
          <h3 style="margin-top: 0; color: #4CAF50;">📦 Arriendo Confirmado</h3>
          <ul style="list-style: none; padding: 0;">
            <li style="margin: 8px 0;"><strong>Código:</strong> ${data.trackingCode}</li>
            <li style="margin: 8px 0;"><strong>Cantidad:</strong> ${data.boxQuantity} cajas</li>
            <li style="margin: 8px 0;"><strong>Fecha de entrega:</strong> ${new Date(data.deliveryDate).toLocaleDateString('es-CL')}</li>
            <li style="margin: 8px 0;"><strong>Fecha de retiro:</strong> ${new Date(data.pickupDate).toLocaleDateString('es-CL')}</li>
            <li style="margin: 8px 0;"><strong>Dirección:</strong> ${data.deliveryAddress}</li>
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

  return await sendEmail({
    to: data.customerEmail,
    subject,
    html: htmlContent
  });
}

// Email para arriendo entregado
export async function sendRentalDeliveredEmail(data: RentalEmailData): Promise<boolean> {
  const trackingUrl = generateTrackingUrl(data.trackingCode, data.trackingToken);
  
  const subject = `✅ Cajas Entregadas - Código ${data.trackingCode}`;
  
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
        <p style="color: white; margin: 10px 0 0 0; font-size: 16px;">Código: <strong>${data.trackingCode}</strong></p>
      </div>
      
      <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
        <h2 style="color: #2E5CA6; margin-top: 0;">Hola ${data.customerName},</h2>
        
        <p>¡Perfecto! Tus ${data.boxQuantity} cajas han sido <strong>ENTREGADAS</strong> exitosamente.</p>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #4CAF50;">
          <h3 style="margin-top: 0; color: #4CAF50;">📦 Entrega Completada</h3>
          <ul style="list-style: none; padding: 0;">
            <li style="margin: 8px 0;"><strong>Cantidad entregada:</strong> ${data.boxQuantity} cajas</li>
            <li style="margin: 8px 0;"><strong>Fecha de retiro programada:</strong> ${new Date(data.pickupDate).toLocaleDateString('es-CL')}</li>
            <li style="margin: 8px 0;"><strong>Dirección:</strong> ${data.deliveryAddress}</li>
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

  return await sendEmail({
    to: data.customerEmail,
    subject,
    html: htmlContent
  });
}

// Email para arriendo retirado
export async function sendRentalPickedUpEmail(data: RentalEmailData): Promise<boolean> {
  const trackingUrl = generateTrackingUrl(data.trackingCode, data.trackingToken);
  
  const subject = `📦 Cajas Retiradas - Código ${data.trackingCode}`;
  
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
        <p style="color: white; margin: 10px 0 0 0; font-size: 16px;">Código: <strong>${data.trackingCode}</strong></p>
      </div>
      
      <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
        <h2 style="color: #2E5CA6; margin-top: 0;">Hola ${data.customerName},</h2>
        
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

  return await sendEmail({
    to: data.customerEmail,
    subject,
    html: htmlContent
  });
}

// Email para arriendo finalizado (con solicitud de review)
export async function sendRentalCompletedEmail(data: RentalEmailData): Promise<boolean> {
  const trackingUrl = generateTrackingUrl(data.trackingCode, data.trackingToken);
  const googleReviewUrl = 'https://g.page/r/CUv8pKvyA5WbEAE/review';
  
  const subject = `🎉 Arriendo Finalizado - Código ${data.trackingCode}`;
  
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
        <p style="color: white; margin: 10px 0 0 0; font-size: 16px;">Código: <strong>${data.trackingCode}</strong></p>
      </div>
      
      <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
        <h2 style="color: #2E5CA6; margin-top: 0;">¡Gracias ${data.customerName}!</h2>
        
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
          
          📞 <strong>Teléfono:</strong> +56 9 XXXX XXXX<br>
          ✉️ <strong>Email:</strong> contacto@arriendocajas.cl<br>
          💬 <strong>WhatsApp:</strong> +56 9 XXXX XXXX
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

  return await sendEmail({
    to: data.customerEmail,
    subject,
    html: htmlContent
  });
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
    case 'finalizada':
      return await sendRentalCompletedEmail(data);
    default:
      console.log(`No email template for status: ${status}`);
      return false;
  }
}