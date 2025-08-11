import { storage } from './storage';
import { emailService } from './emailService';
import { generateTrackingUrl } from './emailTemplates';

export class ReminderService {
  // Check for all reminder emails (delivery and pickup reminders)
  async checkAndSendReminders(): Promise<void> {
    try {
      console.log('Checking for rental reminders...');
      
      await this.checkDeliveryReminders();
      await this.checkPickupReminders();
      
      console.log('All reminder checks completed.');
    } catch (error) {
      console.error('Error checking reminders:', error);
    }
  }

  // Check for rentals that need delivery reminder (1 day before delivery date)
  async checkDeliveryReminders(): Promise<void> {
    try {
      console.log('Checking for delivery reminders...');
      
      // Get all paid rentals that haven't been delivered yet
      const paidRentals = await storage.getRentalsByStatus('pagada');
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);
      
      console.log(`Checking ${paidRentals.length} paid rentals for delivery reminders...`);
      console.log(`Today: ${today.toLocaleDateString()}`);
      console.log(`Tomorrow: ${tomorrow.toLocaleDateString()}`);
      
      for (const rental of paidRentals) {
        const deliveryDate = new Date(rental.deliveryDate);
        deliveryDate.setHours(0, 0, 0, 0);
        
        // Send reminder 1 day before delivery
        if (deliveryDate.getTime() === tomorrow.getTime()) {
          console.log(`Sending delivery reminder for rental ${rental.trackingCode}`);
          await this.sendDeliveryReminderEmail(rental);
        }
      }
      
      console.log('Delivery reminder check completed.');
    } catch (error) {
      console.error('Error checking delivery reminders:', error);
    }
  }

  // Check for rentals that need pickup reminder (2 days before return date)
  async checkPickupReminders(): Promise<void> {
    try {
      console.log('Checking for pickup reminders...');
      
      // Get all delivered rentals
      const deliveredRentals = await storage.getRentalsByStatus('entregada');
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const twoDaysFromNow = new Date(today);
      twoDaysFromNow.setDate(today.getDate() + 2);
      
      console.log(`Checking ${deliveredRentals.length} delivered rentals for pickup reminders...`);
      console.log(`Today: ${today.toLocaleDateString()}`);
      console.log(`Two days from now: ${twoDaysFromNow.toLocaleDateString()}`);
      
      for (const rental of deliveredRentals) {
        // Calculate return date: delivery date + rental days
        const returnDate = new Date(rental.deliveryDate);
        returnDate.setDate(returnDate.getDate() + rental.rentalDays);
        returnDate.setHours(0, 0, 0, 0);
        
        console.log(`Rental ${rental.trackingCode}: Delivery ${new Date(rental.deliveryDate).toLocaleDateString()}, Days: ${rental.rentalDays}, Return date: ${returnDate.toLocaleDateString()}`);
        
        // Send reminder 2 days before pickup
        if (returnDate.getTime() === twoDaysFromNow.getTime()) {
          console.log(`Sending pickup reminder for rental ${rental.trackingCode}`);
          await this.sendPickupReminderEmail(rental);
        }
      }
      
      console.log('Pickup reminder check completed.');
    } catch (error) {
      console.error('Error checking pickup reminders:', error);
    }
  }
  
  private async sendDeliveryReminderEmail(rental: any): Promise<void> {
    try {
      if (!emailService.isEmailConfigured()) {
        console.log(`Delivery reminder email not sent - service not configured. Rental: ${rental.trackingCode}`);
        return;
      }
      
      const customer = await storage.getCustomer(rental.customerId);
      if (!customer?.email) {
        console.log(`No customer email found for rental ${rental.trackingCode}`);
        return;
      }
      
      // Extract last 4 digits before verification digit: "16.220.939-6" -> "0939"
      const rutDigits = customer.rut ? 
        customer.rut.replace(/[.-]/g, '').slice(0, -1).slice(-4).padStart(4, '0') : "0000";
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
        deliveryTime: '09:00 - 18:00',
        contactPhone: '+56987290995'
      };
      
      const success = await emailService.sendRentalStatusEmail(customer.email, 'recordatorio-entrega', emailData);
      
      if (success) {
        console.log(`Delivery reminder email sent successfully to ${customer.email} for rental ${rental.trackingCode}`);
      } else {
        console.log(`Failed to send delivery reminder email for rental ${rental.trackingCode}`);
      }
    } catch (error) {
      console.error(`Error sending delivery reminder email for rental ${rental.trackingCode}:`, error);
    }
  }

  private async sendPickupReminderEmail(rental: any): Promise<void> {
    try {
      if (!emailService.isEmailConfigured()) {
        console.log(`Pickup reminder email not sent - service not configured. Rental: ${rental.trackingCode}`);
        return;
      }
      
      const customer = await storage.getCustomer(rental.customerId);
      if (!customer?.email) {
        console.log(`No customer email found for rental ${rental.trackingCode}`);
        return;
      }
      
      // Extract last 4 digits before verification digit: "16.220.939-6" -> "0939"  
      const rutDigits = customer.rut ? 
        customer.rut.replace(/[.-]/g, '').slice(0, -1).slice(-4).padStart(4, '0') : "0000";
      const trackingUrl = generateTrackingUrl(rutDigits, rental.trackingCode);
      
      // Calculate return date
      const returnDate = new Date(rental.deliveryDate);
      returnDate.setDate(returnDate.getDate() + rental.rentalDays);
      
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
        returnDate: returnDate.toLocaleDateString('es-CL', { 
          year: 'numeric', 
          month: 'long',
          day: 'numeric' 
        }),
        deliveryAddress: rental.deliveryAddress || '',
        pickupAddress: rental.pickupAddress || rental.deliveryAddress || '',
        totalAmount: parseInt(rental.totalAmount || '0'),
        guaranteeAmount: rental.totalBoxes * 2000,
        contactPhone: '+56987290995'
      };
      
      const success = await emailService.sendRentalStatusEmail(customer.email, 'recordatorio-retiro', emailData);
      
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
      
      await this.sendPickupReminderEmail(rental);
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