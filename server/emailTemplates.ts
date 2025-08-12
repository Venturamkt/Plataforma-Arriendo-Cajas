// Email templates for rental status notifications

export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

export interface RentalEmailData {
  customerName: string;
  rentalId: string;
  trackingCode: string;
  trackingUrl: string;
  totalBoxes: number;
  deliveryDate: string;
  deliveryAddress: string;
  totalAmount: number;
  guaranteeAmount: number;
  additionalProducts?: Array<{name: string; price: number}>;
  rentalDays?: number;
}

export const emailTemplates = {
  pendiente: (data: RentalEmailData): EmailTemplate => ({
    subject: `Solicitud Recibida - Código ${data.trackingCode} - Arriendo Cajas`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            .container { max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; }
            .header { background: #C8201D; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; }
            .tracking-box { background: #f8f9fa; border: 2px dashed #C8201D; padding: 15px; margin: 20px 0; text-align: center; }
            .details { background: #f8f9fa; padding: 15px; margin: 15px 0; }
            .footer { background: #2E5CA6; color: white; padding: 15px; text-align: center; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>¡Hola ${data.customerName}!</h1>
              <h2>Solicitud Recibida 📋</h2>
            </div>
            
            <div class="content">
              <p>Hemos recibido tu solicitud de arriendo de cajas. Los detalles están siendo procesados y te contactaremos pronto.</p>
              
              <div class="tracking-box">
                <h3>🔍 Tu Código de Seguimiento</h3>
                <p><strong>Código:</strong> ${data.trackingCode}</p>
                <a href="${data.trackingUrl}" style="background: #C8201D !important; color: white !important; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 10px 0;">Ver Estado</a>
              </div>
              
              <div class="details">
                <h3>📦 Detalles de tu Solicitud</h3>
                <p><strong>Número de cajas:</strong> ${data.totalBoxes}</p>
                <p><strong>Duración:</strong> ${data.rentalDays || 'No especificado'} días</p>
                <p><strong>Dirección de entrega:</strong> ${data.deliveryAddress}</p>
                
                <div style="margin: 15px 0; padding: 10px; background: #ffffff; border: 1px solid #ddd;">
                  <h4 style="margin: 0 0 10px 0; color: #2E5CA6;">💰 Desglose de Precios</h4>
                  <p><strong>Arriendo (${data.totalBoxes} cajas x ${data.rentalDays || 'N/A'} días):</strong> $${data.totalAmount.toLocaleString()}</p>
                  ${data.additionalProducts && data.additionalProducts.length > 0 ? `
                    <p><strong>Productos Adicionales:</strong></p>
                    <ul style="margin: 5px 0; padding-left: 20px;">
                      ${data.additionalProducts.map(product => `<li>${product.name}: $${product.price.toLocaleString()}</li>`).join('')}
                    </ul>
                  ` : ''}
                  <p><strong>Garantía:</strong> $${data.guaranteeAmount.toLocaleString()} (reembolsable)</p>
                  <hr style="margin: 10px 0;">
                  <p style="font-size: 16px;"><strong>Total a Pagar: $${(
                    data.totalAmount + 
                    data.guaranteeAmount + 
                    (data.additionalProducts || []).reduce((sum, product) => sum + product.price, 0)
                  ).toLocaleString()}</strong></p>
                </div>
              </div>
              
              <p>Te contactaremos pronto para coordinar los detalles y confirmar el pago.</p>
            </div>
            
            <div class="footer">
              <p>📞 +56 9 1234 5678 | 📧 jalarcon@arriendocajas.cl</p>
              <p>Arriendo Cajas - Tu solución en almacenamiento temporal</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `¡Hola ${data.customerName}! Hemos recibido tu solicitud de arriendo (${data.trackingCode}). Te contactaremos pronto para coordinar la entrega de ${data.totalBoxes} cajas. Total: $${data.totalAmount.toLocaleString()}. Seguimiento: ${data.trackingUrl}`
  }),

  pagada: (data: RentalEmailData): EmailTemplate => ({
    subject: `¡Tu arriendo ha sido confirmado! - Código ${data.trackingCode}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            .container { max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; }
            .header { background: #C8201D; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; }
            .tracking-box { background: #f8f9fa; border: 2px dashed #C8201D; padding: 15px; margin: 20px 0; text-align: center; }
            .tracking-link { background: #C8201D !important; color: white !important; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 10px 0; }
            .details { background: #f8f9fa; padding: 15px; margin: 15px 0; }
            .footer { background: #2E5CA6; color: white; padding: 15px; text-align: center; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>¡Hola ${data.customerName}!</h1>
              <h2>Tu pago ha sido confirmado 🎉</h2>
            </div>
            
            <div class="content">
              <p>¡Excelentes noticias! Hemos confirmado tu pago y tu arriendo está listo para ser entregado.</p>
              
              <div class="tracking-box">
                <h3>🔍 Seguimiento de tu Arriendo</h3>
                <p><strong>Código de seguimiento:</strong> ${data.trackingCode}</p>
                <a href="${data.trackingUrl}" class="tracking-link" style="background: #C8201D !important; color: white !important; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 10px 0;">Ver Estado en Tiempo Real</a>
                <p style="margin-top: 10px; font-size: 12px; color: #666;">
                  Guarda este enlace para seguir tu arriendo 24/7
                </p>
              </div>
              
              <div class="details">
                <h3>📦 Detalles de tu Arriendo</h3>
                <p><strong>Número de cajas:</strong> ${data.totalBoxes}</p>
                <p><strong>Duración:</strong> ${data.rentalDays || 'No especificado'} días</p>
                <p><strong>Fecha de entrega:</strong> ${data.deliveryDate}</p>
                <p><strong>Dirección:</strong> ${data.deliveryAddress}</p>
                
                <div style="margin: 15px 0; padding: 10px; background: #ffffff; border: 1px solid #ddd;">
                  <h4 style="margin: 0 0 10px 0; color: #2E5CA6;">💰 Desglose de Precios</h4>
                  <p><strong>Arriendo (${data.totalBoxes} cajas x ${data.rentalDays || 'N/A'} días):</strong> $${data.totalAmount.toLocaleString()}</p>
                  ${data.additionalProducts && data.additionalProducts.length > 0 ? `
                    <p><strong>Productos Adicionales:</strong></p>
                    <ul style="margin: 5px 0; padding-left: 20px;">
                      ${data.additionalProducts.map(product => `<li>${product.name}: $${product.price.toLocaleString()}</li>`).join('')}
                    </ul>
                  ` : ''}
                  <p><strong>Garantía:</strong> $${data.guaranteeAmount.toLocaleString()} (se devuelve al finalizar)</p>
                  <hr style="margin: 10px 0;">
                  <p style="font-size: 16px;"><strong>Total Pagado: $${(
                    data.totalAmount + 
                    data.guaranteeAmount + 
                    (data.additionalProducts || []).reduce((sum, product) => sum + product.price, 0)
                  ).toLocaleString()}</strong></p>
                </div>
              </div>
              
              <h3>📋 Próximos Pasos:</h3>
              <ul>
                <li>Te contactaremos para coordinar la entrega</li>
                <li>Usa tu código de seguimiento para ver el estado actualizado</li>
                <li>Prepara el espacio donde ubicarás las cajas</li>
              </ul>
              
              <p>¡Gracias por confiar en Arriendo Cajas! Estamos aquí para ayudarte.</p>
            </div>
            
            <div class="footer">
              <p>Arriendo Cajas - Tu solución de almacenamiento temporal</p>
              <p>¿Preguntas? Contáctanos: jalarcon@arriendocajas.cl</p>
              <p><small>Recibiste este email porque tienes un arriendo activo con nosotros. Para darse de baja, responde con "STOP".</small></p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `¡Hola ${data.customerName}! Tu pago ha sido confirmado. Código de seguimiento: ${data.trackingCode}. Seguimiento: ${data.trackingUrl}. Detalles: ${data.totalBoxes} cajas, entrega ${data.deliveryDate} en ${data.deliveryAddress}. Total: $${data.totalAmount.toLocaleString()}. Garantía: $${data.guaranteeAmount.toLocaleString()}.`
  }),

  entregada: (data: RentalEmailData): EmailTemplate => ({
    subject: `¡Tus cajas han sido entregadas! - ${data.trackingCode}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            .container { max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; }
            .header { background: #28a745; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; }
            .tracking-box { background: #f8f9fa; border: 2px dashed #28a745; padding: 15px; margin: 20px 0; text-align: center; }
            .tracking-link { background: #C8201D !important; color: white !important; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 10px 0; }
            .tips { background: #e8f5e8; padding: 15px; margin: 15px 0; border-left: 4px solid #28a745; }
            .footer { background: #2E5CA6; color: white; padding: 15px; text-align: center; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>¡Entrega Completada! 📦</h1>
              <h2>Hola ${data.customerName}</h2>
            </div>
            
            <div class="content">
              <p>¡Perfecto! Hemos entregado exitosamente tus ${data.totalBoxes} cajas en ${data.deliveryAddress}.</p>
              
              <div class="tracking-box">
                <h3>📱 Sigue tu Arriendo</h3>
                <a href="${data.trackingUrl}" class="tracking-link" style="background: #C8201D !important; color: white !important; text-decoration: none;">Ver Estado Actualizado</a>
                <p style="font-size: 12px; color: #666;">Código: ${data.trackingCode}</p>
              </div>
              
              <div class="tips">
                <h3>💡 Consejos para el mejor uso:</h3>
                <ul>
                  <li>Mantén las cajas en un lugar seco y ventilado</li>
                  <li>No superes el peso máximo recomendado por caja</li>
                  <li>Usa las asas para transportar las cajas de forma segura</li>
                  <li>Evita apilar más de 3 cajas para mayor estabilidad</li>
                </ul>
              </div>
              
              <h3>🕒 Recordatorio Importante:</h3>
              <p>Tu período de arriendo está activo. Te avisaremos cuando se acerque la fecha de retiro.</p>
              
              <p>¡Disfruta el espacio extra y organiza todo como desees!</p>
            </div>
            
            <div class="footer">
              <p>Arriendo Cajas - Más espacio, más orden</p>
              <p>¿Necesitas ayuda? Escríbenos: contacto@arriendocajas.cl</p>
              <p><small>Recibiste este email porque tienes un arriendo activo con nosotros. Para darse de baja, responde con "STOP".</small></p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `¡Hola ${data.customerName}! Tus ${data.totalBoxes} cajas han sido entregadas en ${data.deliveryAddress}. Seguimiento: ${data.trackingUrl} (${data.trackingCode}). ¡Disfruta el espacio extra!`
  }),

  retirada: (data: RentalEmailData): EmailTemplate => ({
    subject: `¡Retiro completado! Gracias por usar Arriendo Cajas - ${data.trackingCode}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            .container { max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; }
            .header { background: #ffc107; color: #212529; padding: 20px; text-align: center; }
            .content { padding: 20px; }
            .success-box { background: #f8f9fa; border: 2px solid #ffc107; padding: 15px; margin: 20px 0; text-align: center; }
            .tracking-link { background: #C8201D !important; color: white !important; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 10px 0; }
            .next-steps { background: #fff3cd; padding: 15px; margin: 15px 0; border-left: 4px solid #ffc107; }
            .footer { background: #2E5CA6; color: white; padding: 15px; text-align: center; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>¡Retiro Exitoso! 📤</h1>
              <h2>Gracias ${data.customerName}</h2>
            </div>
            
            <div class="content">
              <p>¡Excelente! Hemos retirado exitosamente tus ${data.totalBoxes} cajas.</p>
              
              <div class="success-box">
                <h3>✅ Estado Actual</h3>
                <p><strong>Cajas retiradas:</strong> ${data.totalBoxes}</p>
                <a href="${data.trackingUrl}" class="tracking-link" style="background: #C8201D !important; color: white !important; text-decoration: none;">Ver Detalles Finales</a>
                <p style="font-size: 12px; color: #666;">Código: ${data.trackingCode}</p>
              </div>
              
              <div class="next-steps">
                <h3>🔄 Próximos Pasos:</h3>
                <ul>
                  <li>Revisaremos el estado de las cajas</li>
                  <li>Procesaremos la devolución de tu garantía</li>
                  <li>Te confirmaremos cuando esté todo finalizado</li>
                </ul>
              </div>
              
              <h3>💝 ¡Muchas Gracias!</h3>
              <p>Esperamos que Arriendo Cajas te haya ayudado con tu mudanza, renovación o almacenamiento temporal. ¡Fue un placer servirte!</p>
              
              <p>Si necesitas cajas nuevamente en el futuro, ¡estaremos aquí para ayudarte!</p>
            </div>
            
            <div class="footer">
              <p>Arriendo Cajas - Siempre a tu servicio</p>
              <p>¿Cómo fue tu experiencia? Cuéntanos: contacto@arriendocajas.cl</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `¡Hola ${data.customerName}! Hemos retirado exitosamente tus ${data.totalBoxes} cajas. Procesaremos la devolución de tu garantía. Seguimiento: ${data.trackingUrl} (${data.trackingCode}). ¡Gracias por confiar en nosotros!`
  }),

  finalizado: (data: RentalEmailData): EmailTemplate => ({
    subject: `🎉 ¡Arriendo completado! Tu garantía está en proceso - ${data.trackingCode}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            .container { max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; }
            .header { background: #6f42c1; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; }
            .completion-box { background: #f8f9fa; border: 2px solid #6f42c1; padding: 15px; margin: 20px 0; text-align: center; }
            .tracking-link { background: #6f42c1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 10px 0; }
            .guarantee-info { background: #e7f3ff; padding: 15px; margin: 15px 0; border-left: 4px solid #007bff; }
            .rating { background: #f0f8f0; padding: 15px; margin: 15px 0; border-left: 4px solid #28a745; }
            .footer { background: #2E5CA6; color: white; padding: 15px; text-align: center; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>¡Arriendo Completado! 🎊</h1>
              <h2>¡Gracias ${data.customerName}!</h2>
            </div>
            
            <div class="content">
              <p>¡Fantástico! Tu arriendo ha sido completado exitosamente. Todo salió perfecto.</p>
              
              <div class="completion-box">
                <h3>✨ Resumen Final</h3>
                <p><strong>Cajas utilizadas:</strong> ${data.totalBoxes}</p>
                <p><strong>Estado:</strong> Completado</p>
                <a href="${data.trackingUrl}" class="tracking-link" style="background: #C8201D !important; color: white !important; text-decoration: none;">Ver Resumen Completo</a>
                <p style="font-size: 12px; color: #666;">Código: ${data.trackingCode}</p>
              </div>
              
              <div class="guarantee-info">
                <h3>💰 Devolución de Garantía</h3>
                <p><strong>Monto a devolver:</strong> $${data.guaranteeAmount.toLocaleString()}</p>
                <p>Tu garantía está siendo procesada y será devuelta en los próximos días hábiles.</p>
              </div>
              
              <div class="rating">
                <h3>⭐ ¿Cómo fue tu experiencia?</h3>
                <p>Nos encantaría conocer tu opinión para seguir mejorando nuestro servicio.</p>
                <p><a href="https://g.page/r/CUv8pKvyA5WbEAE/review" style="color: #28a745; font-weight: bold;">¡Déjanos una reseña en Google!</a></p>
              </div>
              
              <h3>🔄 ¿Necesitas cajas otra vez?</h3>
              <p>Si en el futuro necesitas nuestro servicio nuevamente, ¡estaremos encantados de ayudarte! Ya tienes una cuenta creada, así que será aún más fácil.</p>
              
              <p><strong>¡Muchas gracias por elegir Arriendo Cajas!</strong></p>
            </div>
            
            <div class="footer">
              <p>Arriendo Cajas - Tu partner en organización</p>
              <p>Síguenos en redes sociales para tips de organización</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `¡Hola ${data.customerName}! Tu arriendo ha sido completado. Garantía de $${data.guaranteeAmount.toLocaleString()} en proceso de devolución. Seguimiento: ${data.trackingUrl} (${data.trackingCode}). ¡Gracias por elegirnos!`
  }),

  recordatorio: (data: RentalEmailData): EmailTemplate => ({
    subject: `⏰ Recordatorio: Entrega de cajas en 2 días - ${data.trackingCode}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            .container { max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; }
            .header { background: #ff9800; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; }
            .reminder-box { background: #fff3e0; border: 2px solid #ff9800; padding: 15px; margin: 20px 0; text-align: center; }
            .tracking-link { background: #C8201D !important; color: white !important; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 10px 0; }
            .checklist { background: #f8f9fa; padding: 15px; margin: 15px 0; border-left: 4px solid #ff9800; }
            .important { background: #ffebee; padding: 15px; margin: 15px 0; border-left: 4px solid #f44336; }
            .footer { background: #2E5CA6; color: white; padding: 15px; text-align: center; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>⏰ ¡Recordatorio Importante!</h1>
              <h2>Hola ${data.customerName}</h2>
            </div>
            
            <div class="content">
              <p>Te recordamos que <strong>en 2 días debes devolver tus cajas de arriendo</strong>.</p>
              
              <div class="reminder-box">
                <h3>📅 Fecha límite de devolución</h3>
                <p><strong>Faltan solo 2 días</strong></p>
                <a href="${data.trackingUrl}" class="tracking-link" style="background: #C8201D !important; color: white !important; text-decoration: none;">Ver Estado del Arriendo</a>
                <p style="font-size: 12px; color: #666;">Código: ${data.trackingCode}</p>
              </div>
              
              <div class="checklist">
                <h3>✅ Lista de preparación para la devolución:</h3>
                <ul>
                  <li><strong>Limpia las cajas:</strong> Retira todo el contenido y limpia el interior</li>
                  <li><strong>Revisa el estado:</strong> Asegúrate de que no tengan daños</li>
                  <li><strong>Apila ordenadamente:</strong> Colócalas en un lugar accesible</li>
                  <li><strong>Confirma la dirección:</strong> ${data.deliveryAddress}</li>
                </ul>
              </div>
              
              <div class="important">
                <h3>🚨 Información importante:</h3>
                <ul>
                  <li>Nos contactaremos contigo para coordinar el retiro</li>
                  <li>Las cajas deben estar limpias y vacías</li>
                  <li>Tu garantía de $${data.guaranteeAmount.toLocaleString()} se devuelve al completar la devolución</li>
                  <li>Si necesitas más tiempo, contáctanos lo antes posible</li>
                </ul>
              </div>
              
              <h3>📞 ¿Necesitas ayuda?</h3>
              <p>Si tienes alguna consulta o necesitas coordinar un horario específico, no dudes en contactarnos:</p>
              <p><strong>Email:</strong> contacto@arriendocajas.cl</p>
              
              <p>¡Gracias por mantener todo en orden!</p>
            </div>
            
            <div class="footer">
              <p>Arriendo Cajas - Tu tiempo es valioso</p>
              <p>Recordatorio automático - No responder a este email</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `¡Hola ${data.customerName}! RECORDATORIO: En 2 días debes devolver tus ${data.totalBoxes} cajas. Prepáralas: límpia, revisa estado, apila ordenadamente. Dirección: ${data.deliveryAddress}. Garantía: $${data.guaranteeAmount.toLocaleString()} se devuelve al completar. Seguimiento: ${data.trackingUrl} (${data.trackingCode}). Consultas: jalarcon@arriendocajas.cl`
  }),

  "recordatorio-entrega": (data: RentalEmailData): EmailTemplate => ({
    subject: `Recordatorio de Entrega - ${data.trackingCode} - Mañana`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            .container { max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; }
            .header { background: #28a745; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; }
            .reminder-box { background: #e8f5e8; border: 2px solid #28a745; padding: 15px; margin: 20px 0; text-align: center; }
            .footer { background: #2E5CA6; color: white; padding: 15px; text-align: center; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🚚 Recordatorio de Entrega</h1>
              <h2>¡Hola ${data.customerName}!</h2>
            </div>
            
            <div class="content">
              <p><strong>¡Tu entrega es mañana!</strong></p>
              
              <div class="reminder-box">
                <h3>📦 Detalles de Entrega</h3>
                <p><strong>Fecha:</strong> ${data.deliveryDate}</p>
                <p><strong>Dirección:</strong> ${data.deliveryAddress}</p>
                <p><strong>Cantidad de cajas:</strong> ${data.totalBoxes}</p>
                <p><strong>Horario aproximado:</strong> 09:00 - 18:00</p>
                <p><strong>Código:</strong> ${data.trackingCode}</p>
              </div>
              
              <h3>📞 Contacto del Conductor</h3>
              <p>Nuestro conductor se contactará contigo el día de la entrega para coordinar el horario exacto.</p>
              <p><strong>WhatsApp/Teléfono:</strong> +56987290995</p>
              
              <p>¡Te esperamos mañana!</p>
            </div>
            
            <div class="footer">
              <p>Arriendo Cajas - Entrega puntual garantizada</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `¡Hola ${data.customerName}! Recordatorio: Tu entrega es mañana (${data.deliveryDate}) en ${data.deliveryAddress}. ${data.totalBoxes} cajas. Horario: 09:00-18:00. Código: ${data.trackingCode}. Contacto conductor: +56987290995. ¡Nos vemos mañana!`
  }),

  "recordatorio-retiro": (data: RentalEmailData): EmailTemplate => ({
    subject: `Recordatorio de Retiro - ${data.trackingCode} - En 2 días`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            .container { max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; }
            .header { background: #ffc107; color: #000; padding: 20px; text-align: center; }
            .content { padding: 20px; }
            .reminder-box { background: #fff3cd; border: 2px solid #ffc107; padding: 15px; margin: 20px 0; text-align: center; }
            .footer { background: #2E5CA6; color: white; padding: 15px; text-align: center; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📅 Recordatorio de Retiro</h1>
              <h2>¡Hola ${data.customerName}!</h2>
            </div>
            
            <div class="content">
              <p><strong>En 2 días debes devolver tus cajas</strong></p>
              
              <div class="reminder-box">
                <h3>📦 Detalles de Retiro</h3>
                <p><strong>Fecha de retiro:</strong> ${(data as any).returnDate}</p>
                <p><strong>Dirección de retiro:</strong> ${(data as any).pickupAddress}</p>
                <p><strong>Cantidad de cajas:</strong> ${data.totalBoxes}</p>
                <p><strong>Código:</strong> ${data.trackingCode}</p>
              </div>
              
              <h3>✅ ¡Prepara tus cajas!</h3>
              <ul>
                <li><strong>Límpia las cajas:</strong> Sin restos de comida, papel o suciedad</li>
                <li><strong>Revisa su estado:</strong> Informa si alguna tiene daños</li>
                <li><strong>Apila ordenadamente:</strong> En la misma ubicación de entrega</li>
                <li><strong>Ten el código listo:</strong> ${data.trackingCode}</li>
              </ul>
              
              <h3>💰 Devolución de Garantía</h3>
              <p>Tu garantía de $${data.guaranteeAmount.toLocaleString()} se devolverá completamente una vez confirmado el retiro.</p>
              
              <h3>📞 Contacto</h3>
              <p>WhatsApp/Teléfono: +56987290995</p>
              <p>Email: contacto@arriendocajas.cl</p>
            </div>
            
            <div class="footer">
              <p>Arriendo Cajas - Gracias por tu confianza</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `¡Hola ${data.customerName}! RECORDATORIO: En 2 días (${(data as any).returnDate}) debes devolver ${data.totalBoxes} cajas en ${(data as any).pickupAddress}. Prepáralas: limpias, apiladas, código ${data.trackingCode} listo. Garantía $${data.guaranteeAmount.toLocaleString()} se devuelve completamente. Contacto: +56987290995`
  }),

  cancelada: (data: RentalEmailData): EmailTemplate => ({
    subject: `Arriendo cancelado - ${data.trackingCode}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            .container { max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; }
            .header { background: #dc3545; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; }
            .cancellation-box { background: #f8f9fa; border: 2px solid #dc3545; padding: 15px; margin: 20px 0; text-align: center; }
            .tracking-link { background: #C8201D !important; color: white !important; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 10px 0; }
            .support { background: #e7f3ff; padding: 15px; margin: 15px 0; border-left: 4px solid #007bff; }
            .footer { background: #2E5CA6; color: white; padding: 15px; text-align: center; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Arriendo Cancelado</h1>
              <h2>Hola ${data.customerName}</h2>
            </div>
            
            <div class="content">
              <p>Tu arriendo ha sido cancelado según tu solicitud. Sentimos que no hayamos podido completar el servicio.</p>
              
              <div class="cancellation-box">
                <h3>❌ Estado de Cancelación</h3>
                <p><strong>Código de referencia:</strong> ${data.trackingCode}</p>
                <a href="${data.trackingUrl}" class="tracking-link" style="background: #C8201D !important; color: white !important; text-decoration: none;">Ver Detalles</a>
              </div>
              
              <div class="support">
                <h3>🤝 ¿Necesitas Ayuda?</h3>
                <p>Si tienes preguntas sobre la cancelación, no dudes en contactarnos:</p>
                <ul>
                  <li>Email: <strong>contacto@arriendocajas.cl</strong></li>
                  <li>Te responderemos a la brevedad</li>
                </ul>
              </div>
              
              <h3>🔄 ¿Quieres intentar de nuevo?</h3>
              <p>Si cambias de opinión o necesitas nuestro servicio en el futuro, estaremos encantados de ayudarte. Tu cuenta permanece activa para futuras solicitudes.</p>
              
              <p>Lamentamos cualquier inconveniente y esperamos poder servirte mejor en una próxima oportunidad.</p>
            </div>
            
            <div class="footer">
              <p>Arriendo Cajas - Siempre buscando mejorar</p>
              <p>Tu feedback es importante: contacto@arriendocajas.cl</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `Hola ${data.customerName}! Tu arriendo ha sido cancelado según tu solicitud. Código: ${data.trackingCode}. Seguimiento: ${data.trackingUrl}. Contacto: contacto@arriendocajas.cl. Lamentamos no haber podido completar el servicio.`
  })
};

// Function to generate tracking URL
export function generateTrackingUrl(rutDigits: string, trackingCode: string): string {
  // Use the current Replit domain for tracking links
  const baseUrl = 'https://441204b6-ae40-4994-b677-be11a32eb976-00-1rsmov5q0kvpq.janeway.replit.dev';
  return `${baseUrl}/track/${rutDigits}/${trackingCode}`;
}