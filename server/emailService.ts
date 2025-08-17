import nodemailer from 'nodemailer';

// Configuración del transporter de email para Gmail Workspace
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'arriendo@arriendocajas.cl', // Email principal del workspace
    pass: process.env.SMTP_PASS?.replace(/\s/g, ''), // App password sin espacios
  },
});

// Tipos de emails
export interface EmailData {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

// Función principal para enviar emails
export async function sendEmail(data: EmailData): Promise<boolean> {
  try {
    if (!process.env.SMTP_PASS) {
      console.log('Email service not configured - skipping email send');
      return false;
    }

    const result = await transporter.sendMail({
      from: `"Arriendo Cajas" <arriendo@arriendocajas.cl>`,
      to: data.to,
      cc: 'contacto@arriendocajas.cl', // Siempre copia a contacto
      subject: data.subject,
      text: data.text,
      html: data.html,
    });

    console.log('Email sent successfully:', result.messageId);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}

// Función para enviar emails de asignación de conductores
export async function sendDriverAssignmentEmail(data: EmailData, driverEmail?: string): Promise<boolean> {
  try {
    if (!process.env.SMTP_PASS) {
      console.log('Email service not configured - skipping email send');
      return false;
    }

    // Enviar a asignaciones@arriendocajas.cl y al email del conductor si existe
    const recipients = ['asignaciones@arriendocajas.cl'];
    if (driverEmail) {
      recipients.push(driverEmail);
    }

    const result = await transporter.sendMail({
      from: `"Arriendo Cajas" <arriendo@arriendocajas.cl>`,
      to: recipients.join(', '),
      subject: data.subject,
      text: data.text,
      html: data.html,
    });

    console.log('Driver assignment email sent successfully:', result.messageId);
    return true;
  } catch (error) {
    console.error('Error sending driver assignment email:', error);
    return false;
  }
}

// Templates de emails
export const emailTemplates = {
  // Email de confirmación de arriendo
  rentalConfirmation: (customerName: string, rentalDetails: any) => ({
    subject: 'Confirmación de Arriendo - Arriendo Cajas',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #C8201D;">¡Arriendo Confirmado!</h2>
        <p>Estimado/a <strong>${customerName}</strong>,</p>
        <p>Su arriendo ha sido confirmado exitosamente. A continuación los detalles:</p>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #2E5CA6; margin-top: 0;">Detalles del Arriendo</h3>
          <p><strong>ID Arriendo:</strong> ${rentalDetails.id.substring(0, 8).toUpperCase()}</p>
          <p><strong>Cantidad de cajas:</strong> ${rentalDetails.boxQuantity}</p>
          <p><strong>Días de arriendo:</strong> ${rentalDetails.rentalDays}</p>
          <p><strong>Precio por día/caja:</strong> $${Number(rentalDetails.pricePerDay).toLocaleString('es-CL')}</p>
          <p><strong>Garantía:</strong> $${Number(rentalDetails.guaranteeAmount).toLocaleString('es-CL')}</p>
          <p><strong>Fecha de entrega:</strong> ${new Date(rentalDetails.deliveryDate).toLocaleDateString('es-CL')}</p>
          <p><strong>Fecha de retiro:</strong> ${new Date(rentalDetails.pickupDate).toLocaleDateString('es-CL')}</p>
          <p><strong>Dirección de entrega:</strong> ${rentalDetails.deliveryAddress}</p>
          ${rentalDetails.pickupAddress && rentalDetails.pickupAddress !== rentalDetails.deliveryAddress ? 
            `<p><strong>Dirección de retiro:</strong> ${rentalDetails.pickupAddress}</p>` : ''}
          ${rentalDetails.notes ? `<p><strong>Notas:</strong> ${rentalDetails.notes}</p>` : ''}
          <hr style="margin: 15px 0;">
          <p style="font-size: 18px;"><strong>Total a pagar:</strong> $${Number(rentalDetails.totalAmount).toLocaleString('es-CL')}</p>
          <p><strong>Pagado:</strong> $${Number(rentalDetails.paidAmount || '0').toLocaleString('es-CL')}</p>
          <p><strong>Pendiente:</strong> $${(Number(rentalDetails.totalAmount) - Number(rentalDetails.paidAmount || '0')).toLocaleString('es-CL')}</p>
        </div>
        
        <p>Nos contactaremos con usted para coordinar la entrega.</p>
        <p>¡Gracias por confiar en nosotros!</p>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
          <p style="color: #666; font-size: 14px;">
            <strong>Arriendo Cajas</strong><br>
            Email: contacto@arriendocajas.cl<br>
            Arriendos: arriendo@arriendocajas.cl<br>
            WhatsApp: +56 9 XXXX XXXX<br>
            Sitio web: www.arriendocajas.cl
          </p>
        </div>
      </div>
    `,
    text: `Estimado/a ${customerName}, su arriendo ha sido confirmado. Detalles: ${rentalDetails.boxQuantity} cajas por ${rentalDetails.rentalDays} días. Entrega: ${rentalDetails.deliveryDate}. Total: $${rentalDetails.totalAmount}`
  }),

  // Email de recordatorio de entrega (1 día antes)
  deliveryReminder: (customerName: string, rentalDetails: any) => ({
    subject: 'Recordatorio: Entrega de Cajas Mañana - Arriendo Cajas',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2E5CA6;">Recordatorio de Entrega</h2>
        <p>Estimado/a <strong>${customerName}</strong>,</p>
        <p>Le recordamos que mañana tenemos programada la entrega de sus cajas:</p>
        
        <div style="background: #e7f3ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #2E5CA6; margin-top: 0;">Detalles de la Entrega</h3>
          <p><strong>Fecha:</strong> ${new Date(rentalDetails.deliveryDate).toLocaleDateString('es-CL')}</p>
          <p><strong>Dirección:</strong> ${rentalDetails.deliveryAddress}</p>
          <p><strong>Cantidad:</strong> ${rentalDetails.boxQuantity} cajas</p>
        </div>
        
        <p>Por favor, asegúrese de estar disponible en la dirección indicada.</p>
        <p>Si necesita reprogramar, contáctenos lo antes posible.</p>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
          <p style="color: #666; font-size: 14px;">
            <strong>Arriendo Cajas</strong><br>
            Email: contacto@arriendocajas.cl<br>
            Arriendos: arriendo@arriendocajas.cl<br>
            WhatsApp: +56 9 XXXX XXXX<br>
            Sitio web: www.arriendocajas.cl
          </p>
        </div>
      </div>
    `,
    text: `Recordatorio: Mañana entregaremos sus ${rentalDetails.boxQuantity} cajas en ${rentalDetails.deliveryAddress}. Fecha: ${rentalDetails.deliveryDate}`
  }),

  // Email de recordatorio de retiro (3 días antes)
  pickupReminder: (customerName: string, rentalDetails: any) => ({
    subject: 'Recordatorio: Retiro de Cajas Próximo - Arriendo Cajas',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #C8201D;">Recordatorio de Retiro</h2>
        <p>Estimado/a <strong>${customerName}</strong>,</p>
        <p>Le recordamos que el retiro de sus cajas está programado para el <strong>${new Date(rentalDetails.pickupDate).toLocaleDateString('es-CL')}</strong>.</p>
        
        <div style="background: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #856404; margin-top: 0;">Detalles del Retiro</h3>
          <p><strong>Fecha:</strong> ${new Date(rentalDetails.pickupDate).toLocaleDateString('es-CL')}</p>
          <p><strong>Cantidad:</strong> ${rentalDetails.boxQuantity} cajas</p>
          <p><strong>Dirección:</strong> ${rentalDetails.deliveryAddress}</p>
        </div>
        
        <p><strong>Importante:</strong> Por favor, tenga las cajas listas para el retiro.</p>
        <p>Si necesita una extensión del período de arriendo, contáctenos.</p>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
          <p style="color: #666; font-size: 14px;">
            <strong>Arriendo Cajas</strong><br>
            Email: contacto@arriendocajas.cl<br>
            Arriendos: arriendo@arriendocajas.cl<br>
            WhatsApp: +56 9 XXXX XXXX<br>
            Sitio web: www.arriendocajas.cl
          </p>
        </div>
      </div>
    `,
    text: `Recordatorio: El retiro de sus ${rentalDetails.boxQuantity} cajas está programado para el ${rentalDetails.pickupDate} en ${rentalDetails.deliveryAddress}.`
  }),

  // Email de confirmación de pago
  paymentConfirmation: (customerName: string, paymentDetails: any) => ({
    subject: 'Pago Recibido - Arriendo Cajas',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #28a745;">¡Pago Recibido!</h2>
        <p>Estimado/a <strong>${customerName}</strong>,</p>
        <p>Hemos recibido su pago correctamente:</p>
        
        <div style="background: #d4edda; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #155724; margin-top: 0;">Detalles del Pago</h3>
          <p><strong>Monto:</strong> $${Number(paymentDetails.amount).toLocaleString('es-CL')}</p>
          <p><strong>Método:</strong> ${paymentDetails.method}</p>
          <p><strong>Fecha:</strong> ${new Date(paymentDetails.date).toLocaleDateString('es-CL')}</p>
          ${paymentDetails.reference ? `<p><strong>Referencia:</strong> ${paymentDetails.reference}</p>` : ''}
        </div>
        
        <p>¡Gracias por su pago!</p>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
          <p style="color: #666; font-size: 14px;">
            <strong>Arriendo Cajas</strong><br>
            Email: contacto@arriendocajas.cl<br>
            Arriendos: arriendo@arriendocajas.cl<br>
            WhatsApp: +56 9 XXXX XXXX<br>
            Sitio web: www.arriendocajas.cl
          </p>
        </div>
      </div>
    `,
    text: `Pago recibido: $${paymentDetails.amount} por ${paymentDetails.method}. Fecha: ${paymentDetails.date}`
  }),

  // Email de asignación de conductor
  driverAssignment: (driverName: string, rentalDetails: any, customerDetails: any) => ({
    subject: `Nueva Asignación de Reparto - Arriendo #${rentalDetails.id.substring(0, 8).toUpperCase()}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2E5CA6;">Nueva Asignación de Reparto</h2>
        <p>Estimado/a <strong>${driverName}</strong>,</p>
        <p>Se le ha asignado un nuevo servicio de reparto:</p>
        
        <div style="background: #e7f3ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #2E5CA6; margin-top: 0;">Detalles del Arriendo</h3>
          <p><strong>ID Arriendo:</strong> ${rentalDetails.id.substring(0, 8).toUpperCase()}</p>
          <p><strong>Cliente:</strong> ${customerDetails.name}</p>
          <p><strong>Teléfono:</strong> ${customerDetails.phone}</p>
          <p><strong>Cantidad de cajas:</strong> ${rentalDetails.boxQuantity}</p>
          <p><strong>Fecha de entrega:</strong> ${new Date(rentalDetails.deliveryDate).toLocaleDateString('es-CL')}</p>
          <p><strong>Dirección de entrega:</strong> ${rentalDetails.deliveryAddress}</p>
          ${rentalDetails.pickupDate ? `<p><strong>Fecha de retiro:</strong> ${new Date(rentalDetails.pickupDate).toLocaleDateString('es-CL')}</p>` : ''}
          ${rentalDetails.pickupAddress && rentalDetails.pickupAddress !== rentalDetails.deliveryAddress ? 
            `<p><strong>Dirección de retiro:</strong> ${rentalDetails.pickupAddress}</p>` : ''}
          ${rentalDetails.notes ? `<p><strong>Notas especiales:</strong> ${rentalDetails.notes}</p>` : ''}
        </div>
        
        <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0; color: #856404;"><strong>Instrucciones:</strong></p>
          <ul style="color: #856404; margin: 10px 0;">
            <li>Confirmar disponibilidad para la fecha asignada</li>
            <li>Contactar al cliente antes de la entrega/retiro</li>
            <li>Verificar dirección y horario con el cliente</li>
            <li>Reportar cualquier novedad a asignaciones@arriendocajas.cl</li>
          </ul>
        </div>
        
        <p>Por favor, confirme la recepción de esta asignación.</p>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
          <p style="color: #666; font-size: 14px;">
            <strong>Arriendo Cajas</strong><br>
            Email: contacto@arriendocajas.cl<br>
            Asignaciones: asignaciones@arriendocajas.cl<br>
            WhatsApp: +56 9 XXXX XXXX<br>
            Sitio web: www.arriendocajas.cl
          </p>
        </div>
      </div>
    `,
    text: `Nueva asignación: Arriendo #${rentalDetails.id.substring(0, 8)} para ${customerDetails.name}. Entregar ${rentalDetails.boxQuantity} cajas el ${rentalDetails.deliveryDate} en ${rentalDetails.deliveryAddress}. Confirmar recepción.`
  })
};