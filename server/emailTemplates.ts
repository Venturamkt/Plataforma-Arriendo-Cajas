import { generateTrackingUrl } from './trackingUtils';

// Template mejorado para confirmación de arriendo con tracking
export function generateRentalConfirmationTemplate(rental: any, customer: any, driver?: any): { html: string; text: string } {
  const deliveryDate = rental.deliveryDate ? new Date(rental.deliveryDate).toLocaleDateString('es-CL') : 'Por definir';
  const pickupDate = rental.pickupDate ? new Date(rental.pickupDate).toLocaleDateString('es-CL') : 'Por definir';
  
  // Generar URL de tracking si están disponibles los códigos
  const trackingUrl = rental.trackingCode && rental.trackingToken 
    ? generateTrackingUrl(rental.trackingCode, rental.trackingToken)
    : null;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Confirmación de Arriendo - Arriendo Cajas</title>
    </head>
    <body style="margin: 0; padding: 20px; font-family: 'Segoe UI', Arial, sans-serif; background-color: #f8f9fa;">
      <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #C8201D 0%, #2E5CA6 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">¡Arriendo Confirmado! 🎉</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">Tu reserva ha sido procesada exitosamente</p>
          ${trackingUrl ? `
          <div style="margin-top: 20px; padding: 15px; background-color: rgba(255,255,255,0.1); border-radius: 8px;">
            <p style="color: white; margin: 0 0 10px 0; font-size: 14px;">🔍 Código de Seguimiento:</p>
            <p style="color: white; margin: 0; font-size: 20px; font-weight: bold; letter-spacing: 2px;">${rental.trackingCode}</p>
          </div>
          ` : ''}
        </div>
        
        <!-- Content -->
        <div style="padding: 40px 30px;">
          <p style="color: #333; font-size: 16px; line-height: 1.6; margin-bottom: 25px;">
            ¡Hola <strong>${customer.name}</strong>! 👋
          </p>
          
          <p style="color: #333; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
            ¡Excelente! Tu arriendo de cajas está confirmado y listo. Aquí tienes todos los detalles importantes:
          </p>
          
          ${trackingUrl ? `
          <!-- Botón de Tracking -->
          <div style="text-align: center; margin-bottom: 30px;">
            <a href="${trackingUrl}" style="display: inline-block; background: linear-gradient(135deg, #C8201D 0%, #2E5CA6 100%); color: white; text-decoration: none; padding: 15px 30px; border-radius: 25px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 12px rgba(200, 32, 29, 0.3);">
              🔍 Seguir mi Arriendo
            </a>
            <p style="color: #666; margin: 10px 0 0 0; font-size: 14px;">
              Guarda este enlace para ver el estado de tu arriendo en cualquier momento
            </p>
          </div>
          ` : ''}
          
          <!-- Detalles del Arriendo -->
          <div style="background-color: #f8f9fa; border-radius: 8px; padding: 25px; margin-bottom: 30px;">
            <h3 style="color: #C8201D; margin-top: 0; margin-bottom: 20px; font-size: 18px;">📦 Detalles del Arriendo</h3>
            
            <div style="display: grid; gap: 12px;">
              <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e9ecef;">
                <span style="color: #666; font-weight: 500;">Cantidad de cajas:</span>
                <span style="color: #333; font-weight: bold;">${rental.boxQuantity} cajas</span>
              </div>
              
              <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e9ecef;">
                <span style="color: #666; font-weight: 500;">Fecha de entrega:</span>
                <span style="color: #333; font-weight: bold;">${deliveryDate}</span>
              </div>
              
              <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e9ecef;">
                <span style="color: #666; font-weight: 500;">Fecha de retiro:</span>
                <span style="color: #333; font-weight: bold;">${pickupDate}</span>
              </div>
              
              <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e9ecef;">
                <span style="color: #666; font-weight: 500;">Dirección de entrega:</span>
                <span style="color: #333; font-weight: bold;">${rental.deliveryAddress || 'Por definir'}</span>
              </div>
              
              <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e9ecef;">
                <span style="color: #666; font-weight: 500;">Estado:</span>
                <span style="color: #28a745; font-weight: bold; text-transform: capitalize;">${rental.status}</span>
              </div>
              
              <div style="display: flex; justify-content: space-between; padding: 8px 0;">
                <span style="color: #666; font-weight: 500;">Total:</span>
                <span style="color: #C8201D; font-weight: bold; font-size: 18px;">$${parseInt(rental.totalAmount).toLocaleString('es-CL')}</span>
              </div>
            </div>
          </div>
          
          ${driver ? `
          <!-- Información del Repartidor -->
          <div style="background-color: #e8f4fd; border-radius: 8px; padding: 25px; margin-bottom: 30px;">
            <h3 style="color: #2E5CA6; margin-top: 0; margin-bottom: 15px; font-size: 18px;">🚚 Tu Repartidor Asignado</h3>
            <p style="color: #333; margin: 0; font-size: 16px;"><strong>${driver.name}</strong></p>
            <p style="color: #666; margin: 5px 0 0 0; font-size: 14px;">Se pondrá en contacto contigo para coordinar la entrega</p>
          </div>
          ` : ''}
          
          <!-- Tips para evitar spam -->
          <div style="background-color: #d1ecf1; border-left: 4px solid #17a2b8; padding: 20px; margin-bottom: 30px;">
            <h3 style="color: #0c5460; margin-top: 0; margin-bottom: 15px; font-size: 16px;">💡 Tips Importantes</h3>
            <ul style="color: #333; margin: 0; padding-left: 20px; line-height: 1.6; font-size: 14px;">
              <li><strong>Guarda este email:</strong> Es tu comprobante oficial del arriendo</li>
              <li><strong>Revisa tu bandeja de spam:</strong> Asegúrate de que nuestros emails lleguen a tu bandeja principal</li>
              <li><strong>Agrega a tus contactos:</strong> jalarcon@arriendocajas.cl para recibir todas las actualizaciones</li>
              <li><strong>Usa el link de seguimiento:</strong> Para ver el estado actualizado de tu arriendo</li>
            </ul>
          </div>
          
          <!-- Próximos Pasos -->
          <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 20px; margin-bottom: 30px;">
            <h3 style="color: #856404; margin-top: 0; margin-bottom: 15px; font-size: 16px;">⏰ ¿Qué Sigue?</h3>
            <ul style="color: #333; margin: 0; padding-left: 20px; line-height: 1.6;">
              <li>📞 Te llamaremos para confirmar horarios de entrega</li>
              <li>🏠 Prepara el espacio donde recibirás las cajas</li>
              <li>📱 Ten tu teléfono disponible para coordinar con el repartidor</li>
              <li>💰 Prepara el pago según lo acordado</li>
            </ul>
          </div>
          
          <!-- Contacto -->
          <div style="text-align: center; padding: 20px 0; border-top: 1px solid #e9ecef;">
            <p style="color: #666; margin: 0 0 10px 0;">¿Dudas? ¡Estamos aquí para ayudarte! 😊</p>
            <p style="color: #C8201D; font-weight: bold; margin: 0;">📞 +56 9 XXXX XXXX | ✉️ contacto@arriendocajas.cl</p>
          </div>
        </div>
        
        <!-- Footer -->
        <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #e9ecef;">
          <p style="color: #666; margin: 0; font-size: 14px;">
            <strong>Arriendo Cajas</strong> - Soluciones inteligentes para tus mudanzas
          </p>
          <p style="color: #999; margin: 5px 0 0 0; font-size: 12px;">
            Email automático generado el ${new Date().toLocaleDateString('es-CL')}
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
¡Arriendo Confirmado! - Arriendo Cajas

Hola ${customer.name}!

Tu arriendo de cajas está confirmado y listo. Aquí tienes los detalles:

${trackingUrl ? `🔍 Seguimiento: ${trackingUrl}\nCódigo: ${rental.trackingCode}\n` : ''}

📦 DETALLES DEL ARRIENDO:
- Cantidad: ${rental.boxQuantity} cajas
- Entrega: ${deliveryDate}
- Retiro: ${pickupDate}
- Dirección: ${rental.deliveryAddress || 'Por definir'}
- Total: $${parseInt(rental.totalAmount).toLocaleString('es-CL')}

${driver ? `🚚 REPARTIDOR ASIGNADO: ${driver.name}` : ''}

💡 TIPS IMPORTANTES:
- Guarda este email como comprobante oficial
- Revisa tu bandeja de spam y agrega jalarcon@arriendocajas.cl a tus contactos
- Usa el link de seguimiento para ver actualizaciones

⏰ PRÓXIMOS PASOS:
- Te llamaremos para confirmar horarios
- Prepara el espacio para las cajas
- Ten tu teléfono disponible
- Prepara el pago según lo acordado

¿Dudas? Contáctanos:
📞 +56 9 XXXX XXXX
✉️ contacto@arriendocajas.cl

Arriendo Cajas - Soluciones inteligentes para tus mudanzas
  `;

  return { html, text };
}

// Template para asignación de conductor
export function generateDriverAssignmentTemplate(rental: any, customer: any, driver: any): { html: string; text: string } {
  const deliveryDate = rental.deliveryDate ? new Date(rental.deliveryDate).toLocaleDateString('es-CL') : 'Por definir';
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Asignación de Conductor - Arriendo Cajas</title>
    </head>
    <body style="margin: 0; padding: 20px; font-family: 'Segoe UI', Arial, sans-serif; background-color: #f8f9fa;">
      <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #2E5CA6 0%, #C8201D 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px; font-weight: bold;">🚚 Nueva Asignación</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">Arriendo asignado para entrega</p>
        </div>
        
        <!-- Content -->
        <div style="padding: 30px;">
          <p style="color: #333; font-size: 16px; line-height: 1.6; margin-bottom: 25px;">
            Hola <strong>${driver.name}</strong>,
          </p>
          
          <p style="color: #333; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
            Se te ha asignado un nuevo arriendo para entrega. Por favor revisa los detalles y coordina con el cliente:
          </p>
          
          <!-- Información del Cliente -->
          <div style="background-color: #f8f9fa; border-radius: 8px; padding: 25px; margin-bottom: 25px;">
            <h3 style="color: #C8201D; margin-top: 0; margin-bottom: 15px; font-size: 18px;">👤 Cliente</h3>
            <p style="color: #333; margin: 0 0 8px 0;"><strong>Nombre:</strong> ${customer.name}</p>
            <p style="color: #333; margin: 0 0 8px 0;"><strong>Teléfono:</strong> ${customer.phone}</p>
            <p style="color: #333; margin: 0;"><strong>Email:</strong> ${customer.email}</p>
          </div>
          
          <!-- Detalles del Arriendo -->
          <div style="background-color: #e8f4fd; border-radius: 8px; padding: 25px; margin-bottom: 25px;">
            <h3 style="color: #2E5CA6; margin-top: 0; margin-bottom: 15px; font-size: 18px;">📦 Arriendo</h3>
            <p style="color: #333; margin: 0 0 8px 0;"><strong>Cantidad:</strong> ${rental.boxQuantity} cajas</p>
            <p style="color: #333; margin: 0 0 8px 0;"><strong>Fecha de entrega:</strong> ${deliveryDate}</p>
            <p style="color: #333; margin: 0 0 8px 0;"><strong>Dirección:</strong> ${rental.deliveryAddress}</p>
            <p style="color: #333; margin: 0;"><strong>Total:</strong> $${parseInt(rental.totalAmount).toLocaleString('es-CL')}</p>
          </div>
          
          <!-- Instrucciones -->
          <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 20px; margin-bottom: 25px;">
            <h3 style="color: #856404; margin-top: 0; margin-bottom: 15px; font-size: 16px;">📋 Instrucciones</h3>
            <ul style="color: #333; margin: 0; padding-left: 20px; line-height: 1.6;">
              <li>Contacta al cliente para coordinar horario de entrega</li>
              <li>Confirma la dirección exacta antes de salir</li>
              <li>Lleva las cajas en buen estado</li>
              <li>Actualiza el estado del arriendo después de la entrega</li>
            </ul>
          </div>
          
          <!-- Contacto -->
          <div style="text-align: center; padding: 20px 0; border-top: 1px solid #e9ecef;">
            <p style="color: #666; margin: 0 0 10px 0;">¿Problemas con la asignación?</p>
            <p style="color: #C8201D; font-weight: bold; margin: 0;">📞 Coordinación: +56 9 XXXX XXXX</p>
          </div>
        </div>
        
        <!-- Footer -->
        <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #e9ecef;">
          <p style="color: #666; margin: 0; font-size: 14px;">
            Arriendo Cajas - Sistema de Asignaciones
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
🚚 Nueva Asignación - Arriendo Cajas

Hola ${driver.name},

Se te ha asignado un nuevo arriendo para entrega:

👤 CLIENTE:
- Nombre: ${customer.name}
- Teléfono: ${customer.phone}
- Email: ${customer.email}

📦 ARRIENDO:
- Cantidad: ${rental.boxQuantity} cajas
- Fecha: ${deliveryDate}
- Dirección: ${rental.deliveryAddress}
- Total: $${parseInt(rental.totalAmount).toLocaleString('es-CL')}

📋 INSTRUCCIONES:
- Contacta al cliente para coordinar horario
- Confirma dirección exacta antes de salir
- Lleva cajas en buen estado
- Actualiza estado después de entregar

¿Problemas? Contacta coordinación: +56 9 XXXX XXXX

Arriendo Cajas - Sistema de Asignaciones
  `;

  return { html, text };
}