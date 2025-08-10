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
        subject: emailContent.subject,
        text: emailContent.text,
        html: emailContent.html,
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log(`Email sent successfully for status ${status} to ${customerEmail}:`, result.messageId);
      return true;
    } catch (error) {
      console.error(`Error sending email for status ${status}:`, error);
      // Recreate transporter on auth failure
      if (error.code === 'EAUTH') {
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
}

// Export singleton instance
export const emailService = new EmailService();