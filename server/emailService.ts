import nodemailer from 'nodemailer';
import { emailTemplates, generateTrackingUrl, type RentalEmailData } from './emailTemplates';

// Email service configuration
export class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private isConfigured = false;

  constructor() {
    this.setupTransporter();
  }

  private setupTransporter() {
    try {
      // Check if email credentials are available
      const emailUser = process.env.EMAIL_USER;
      const emailPass = process.env.EMAIL_PASS;
      const emailHost = process.env.EMAIL_HOST || 'smtp.gmail.com';
      const emailPort = parseInt(process.env.EMAIL_PORT || '587');

      if (emailUser && emailPass) {
        this.transporter = nodemailer.createTransport({
          host: emailHost,
          port: emailPort,
          secure: emailPort === 465, // true for 465, false for other ports
          auth: {
            user: emailUser,
            pass: emailPass, // Use app password for Gmail
          },
          tls: {
            rejectUnauthorized: false
          }
        });
        
        this.isConfigured = true;
        console.log('Email service configured successfully');
      } else {
        console.log('Email service not configured - missing credentials');
      }
    } catch (error) {
      console.error('Error setting up email transporter:', error);
    }
  }

  async sendRentalStatusEmail(
    customerEmail: string, 
    status: string, 
    rentalData: RentalEmailData
  ): Promise<boolean> {
    if (!this.isConfigured || !this.transporter) {
      console.log(`Email not sent - service not configured. Status: ${status}, Customer: ${customerEmail}`);
      return false;
    }

    try {
      // Verify connection before sending
      await this.transporter.verify();
      
      const template = emailTemplates[status as keyof typeof emailTemplates];
      if (!template) {
        console.error(`No email template found for status: ${status}`);
        return false;
      }

      const emailContent = template(rentalData);

      const mailOptions = {
        from: `"Arriendo Cajas" <${process.env.EMAIL_USER}>`,
        to: customerEmail,
        cc: 'arriendo@arriendocajas.cl', // Copy to arriendo@arriendocajas.cl for all status change emails
        subject: emailContent.subject,
        text: emailContent.text,
        html: emailContent.html,
        replyTo: process.env.EMAIL_USER,
        headers: {
          'X-Priority': '3',
          'X-MSMail-Priority': 'Normal',
          'Importance': 'Normal',
          'X-Mailer': 'Arriendo Cajas System v1.0',
          'List-Unsubscribe': `<mailto:${process.env.EMAIL_USER}?subject=STOP>`,
          'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
        }
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log(`Email sent successfully for status ${status} to ${customerEmail}:`, result.messageId);
      return true;
    } catch (error) {
      console.error(`Error sending email for status ${status}:`, error);
      // Recreate transporter on auth failure
      if ((error as any).code === 'EAUTH') {
        console.log('Recreating email transporter due to auth error...');
        this.setupTransporter();
      }
      return false;
    }
  }

  // Method to test email configuration
  async testConnection(): Promise<boolean> {
    if (!this.transporter) {
      return false;
    }

    try {
      await this.transporter.verify();
      return true;
    } catch (error) {
      console.error('Email connection test failed:', error);
      return false;
    }
  }

  // Check if email service is configured
  isEmailConfigured(): boolean {
    return this.isConfigured;
  }

  // Preview email templates (for admin)
  getEmailPreview(status: string, sampleData?: Partial<RentalEmailData>): string | null {
    const template = emailTemplates[status as keyof typeof emailTemplates];
    if (!template) {
      return null;
    }

    // Sample data for preview
    const previewData: RentalEmailData = {
      customerName: sampleData?.customerName || 'María González',
      rentalId: sampleData?.rentalId || 'sample-rental-id',
      trackingCode: sampleData?.trackingCode || 'ABC12345',
      trackingUrl: sampleData?.trackingUrl || generateTrackingUrl('1234', 'ABC12345'),
      totalBoxes: sampleData?.totalBoxes || 5,
      deliveryDate: sampleData?.deliveryDate || '15 de Enero, 2025',
      deliveryAddress: sampleData?.deliveryAddress || 'Av. Providencia 1234, Providencia, Santiago',
      totalAmount: sampleData?.totalAmount || 13876,
      guaranteeAmount: sampleData?.guaranteeAmount || 10000,
    };

    return template(previewData).html;
  }

  // Send driver assignment email
  async sendDriverAssignmentEmail(
    driverEmail: string,
    assignmentData: {
      driverName: string;
      customerName: string;
      customerAddress: string;
      customerPhone: string;
      trackingCode: string;
      totalBoxes: number;
      deliveryDate: string;
      notes?: string;
    }
  ): Promise<boolean> {
    if (!this.isConfigured || !this.transporter) {
      console.log(`Driver assignment email not sent - service not configured. Driver: ${driverEmail}`);
      return false;
    }

    try {
      const mailOptions = {
        from: `"Arriendo Cajas" <${process.env.EMAIL_USER}>`,
        to: driverEmail,
        cc: 'asignaciones@arriendocajas.cl', // Copy to asignaciones@arriendocajas.cl for driver assignments
        subject: `Nueva Entrega Asignada - Código ${assignmentData.trackingCode}`,
        html: this.getDriverAssignmentEmailTemplate(assignmentData),
        text: `Nueva entrega asignada para ${assignmentData.customerName}. Código: ${assignmentData.trackingCode}. Dirección: ${assignmentData.customerAddress}. Teléfono: ${assignmentData.customerPhone}. Cajas: ${assignmentData.totalBoxes}. Fecha: ${assignmentData.deliveryDate}.`,
        replyTo: process.env.EMAIL_USER,
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log(`Driver assignment email sent successfully to ${driverEmail}:`, result.messageId);
      return true;
    } catch (error) {
      console.error('Error sending driver assignment email:', error);
      return false;
    }
  }

  private getDriverAssignmentEmailTemplate(data: any): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            .container { max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; }
            .header { background: #2E5CA6; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; }
            .delivery-info { background: #f8f9fa; border-left: 4px solid #2E5CA6; padding: 15px; margin: 20px 0; }
            .customer-info { background: #fff8dc; border-left: 4px solid #ffa500; padding: 15px; margin: 15px 0; }
            .footer { background: #C8201D; color: white; padding: 15px; text-align: center; font-size: 12px; }
            .highlight { color: #C8201D; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🚚 Nueva Entrega Asignada</h1>
              <h2>¡Hola ${data.driverName}!</h2>
            </div>
            
            <div class="content">
              <p>Se te ha asignado una nueva entrega de cajas. Por favor revisa los detalles:</p>
              
              <div class="delivery-info">
                <h3>📦 Información de Entrega</h3>
                <p><strong>Código de Seguimiento:</strong> <span class="highlight">${data.trackingCode}</span></p>
                <p><strong>Cantidad de Cajas:</strong> ${data.totalBoxes}</p>
                <p><strong>Fecha de Entrega:</strong> ${data.deliveryDate}</p>
                ${data.notes ? `<p><strong>Notas Especiales:</strong> ${data.notes}</p>` : ''}
              </div>
              
              <div class="customer-info">
                <h3>👤 Información del Cliente</h3>
                <p><strong>Nombre:</strong> ${data.customerName}</p>
                <p><strong>Dirección:</strong> ${data.customerAddress}</p>
                <p><strong>Teléfono:</strong> ${data.customerPhone}</p>
              </div>
              
              <div style="background: #e8f5e8; border-left: 4px solid #28a745; padding: 15px; margin: 20px 0;">
                <h3>✅ Instrucciones Importantes</h3>
                <ul>
                  <li>Confirma la entrega antes de salir</li>
                  <li>Solicita identificación del cliente</li>
                  <li>Toma foto de confirmación de entrega</li>
                  <li>Actualiza el estado en el sistema móvil</li>
                  <li>En caso de problemas, contacta inmediatamente</li>
                </ul>
              </div>
              
              <p style="text-align: center; margin-top: 30px;">
                <strong>¡Gracias por tu trabajo!</strong><br>
                Equipo Arriendo Cajas
              </p>
            </div>
            
            <div class="footer">
              <p>📞 +56 9 1234 5678 | 📧 jalarcon@arriendocajas.cl</p>
              <p>Arriendo Cajas - Entrega confiable, siempre a tiempo</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  // Send reminder email with CC
  async sendReminderEmail(customerEmail: string, rentalData: RentalEmailData): Promise<boolean> {
    if (!this.isConfigured || !this.transporter) {
      console.log(`Reminder email not sent - service not configured. Customer: ${customerEmail}`);
      return false;
    }

    try {
      const template = emailTemplates.recordatorio;
      const emailContent = template(rentalData);

      const mailOptions = {
        from: `"Arriendo Cajas" <${process.env.EMAIL_USER}>`,
        to: customerEmail,
        cc: 'arriendo@arriendocajas.cl', // Copy to arriendo@arriendocajas.cl for reminders
        subject: emailContent.subject,
        text: emailContent.text,
        html: emailContent.html,
        replyTo: process.env.EMAIL_USER,
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log(`Reminder email sent successfully to ${customerEmail}:`, result.messageId);
      return true;
    } catch (error) {
      console.error('Error sending reminder email:', error);
      return false;
    }
  }
}

// Export singleton instance
export const emailService = new EmailService();