import { storage } from './storage';
import { emailService } from './emailService';
import { generateTrackingUrl } from './emailTemplates';

export class ReminderService {
  // Check for rentals that need reminder emails (2 days before return date)
  async checkAndSendReminders(): Promise<void> {
    try {
      console.log('Checking for rental reminders...');
      
      // Get all active rentals (entregada status)
      const activeRentals = await storage.getRentalsByStatus('entregada');
      
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Start of today
      
      const twoDaysFromNow = new Date(today);
      twoDaysFromNow.setDate(today.getDate() + 2);
      
      console.log(`Checking ${activeRentals.length} active rentals for reminders...`);
      console.log(`Today: ${today.toLocaleDateString()}`);
      console.log(`Two days from now: ${twoDaysFromNow.toLocaleDateString()}`);
      
      for (const rental of activeRentals) {
        // Use the returnDate from the rental if available, or calculate based on common periods
        let returnDate;
        if (rental.returnDate) {
          returnDate = new Date(rental.returnDate);
        } else {
          // If no return date set, assume 7 days (most common)
          returnDate = new Date(rental.deliveryDate);
          returnDate.setDate(returnDate.getDate() + 7);
        }
        returnDate.setHours(0, 0, 0, 0); // Start of return date
        
        console.log(`Rental ${rental.trackingCode}: Return date ${returnDate.toLocaleDateString()}`);
        
        // Check if return date is exactly 2 days from now
        if (returnDate.getTime() === twoDaysFromNow.getTime()) {
          console.log(`Sending reminder for rental ${rental.trackingCode}`);
          await this.sendReminderEmail(rental);
        }
      }
      
      console.log('Reminder check completed.');
    } catch (error) {
      console.error('Error checking reminders:', error);
    }
  }
  
  private async sendReminderEmail(rental: any): Promise<void> {
    try {
      if (!emailService.isEmailConfigured()) {
        console.log(`Reminder email not sent - service not configured. Rental: ${rental.trackingCode}`);
        return;
      }
      
      const customer = await storage.getCustomer(rental.customerId);
      if (!customer?.email) {
        console.log(`No customer email found for rental ${rental.trackingCode}`);
        return;
      }
      
      const rutDigits = customer.rut ? customer.rut.slice(0, -1).slice(-4).padStart(4, '0') : "0000";
      const trackingUrl = generateTrackingUrl(rutDigits, rental.trackingCode);
      
      const emailData = {
        customerName: customer.name,
        rentalId: rental.id,
        trackingCode: rental.trackingCode || '',
        trackingUrl: trackingUrl,
        totalBoxes: rental.totalBoxes,
        deliveryDate: rental.deliveryDate.toLocaleDateString('es-CL', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        }),
        deliveryAddress: rental.deliveryAddress || '',
        totalAmount: parseInt(rental.totalAmount || '0'),
        guaranteeAmount: rental.totalBoxes * 2000,
      };
      
      const success = await emailService.sendRentalStatusEmail(customer.email, 'recordatorio', emailData);
      
      if (success) {
        console.log(`Reminder email sent successfully to ${customer.email} for rental ${rental.trackingCode}`);
      } else {
        console.log(`Failed to send reminder email for rental ${rental.trackingCode}`);
      }
    } catch (error) {
      console.error(`Error sending reminder email for rental ${rental.trackingCode}:`, error);
    }
  }
  
  // Manual method to check reminders (for testing)
  async sendTestReminder(rentalId: string): Promise<boolean> {
    try {
      const rental = await storage.getRental(rentalId);
      if (!rental) {
        console.log(`Rental ${rentalId} not found`);
        return false;
      }
      
      await this.sendReminderEmail(rental);
      return true;
    } catch (error) {
      console.error(`Error sending test reminder for rental ${rentalId}:`, error);
      return false;
    }
  }
  
  // Get rentals that will need reminders in the next few days (for admin preview)
  async getUpcomingReminders(days: number = 7): Promise<any[]> {
    try {
      const activeRentals = await storage.getRentalsByStatus('entregada');
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const upcomingReminders = [];
      
      for (const rental of activeRentals) {
        let returnDate;
        if (rental.returnDate) {
          returnDate = new Date(rental.returnDate);
        } else {
          // If no return date set, assume 7 days (most common)
          returnDate = new Date(rental.deliveryDate);
          returnDate.setDate(returnDate.getDate() + 7);
        }
        returnDate.setHours(0, 0, 0, 0);
        
        const reminderDate = new Date(returnDate);
        reminderDate.setDate(returnDate.getDate() - 2); // 2 days before return
        
        const daysUntilReminder = Math.ceil((reminderDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysUntilReminder >= 0 && daysUntilReminder <= days) {
          const customer = await storage.getCustomer(rental.customerId);
          upcomingReminders.push({
            rental,
            customer,
            returnDate,
            reminderDate,
            daysUntilReminder,
            daysUntilReturn: Math.ceil((returnDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
          });
        }
      }
      
      return upcomingReminders.sort((a, b) => a.daysUntilReminder - b.daysUntilReminder);
    } catch (error) {
      console.error('Error getting upcoming reminders:', error);
      return [];
    }
  }
}

export const reminderService = new ReminderService();