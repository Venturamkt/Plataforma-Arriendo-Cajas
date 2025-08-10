import type { Express } from "express";
import { db } from "./db";

export function setupTaskRoutes(app: Express) {
  
  // Get driver's tasks for today
  app.get('/api/tasks/today', async (req, res) => {
    try {
      // Validate session
      const session = req.session as any;
      if (!session.driver) {
        return res.status(401).json({ message: "No autorizado" });
      }
      
      const driverId = session.driver.id;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      // Get assigned rentals for today from the database using standard query
      const { storage } = await import('./storage');
      const allRentals = await storage.getRentals();
      
      // Filter rentals assigned to this driver for today
      const tasks = allRentals.filter(rental => {
        if (rental.assignedDriver !== driverId) return false;
        
        if (!rental.deliveryDate) return false;
        
        const deliveryDate = new Date(rental.deliveryDate);
        deliveryDate.setHours(0, 0, 0, 0);
        
        return deliveryDate.getTime() === today.getTime();
      });
      
      // Transform rentals into driver tasks
      const driverTasks = await Promise.all(tasks.map(async rental => {
        const customer = await storage.getCustomer(rental.customerId);
        const rentalBoxes = await storage.getRentalBoxes(rental.id);
        
        // Determine task type based on rental status
        let taskType = 'delivery';
        if (rental.status === 'entregada') {
          taskType = 'pickup'; // Time to pick up the boxes
        }
        
        const isCompleted = ['retirada', 'finalizado'].includes(rental.status || '');
        
        return {
          id: rental.id,
          type: taskType,
          status: isCompleted ? 'completed' : 'pending',
          time: rental.deliveryDate ? new Date(rental.deliveryDate).toLocaleTimeString('es-CL', { 
            hour: '2-digit', 
            minute: '2-digit' 
          }) : '09:00',
          customer: customer?.name || 'Cliente',
          phone: customer?.phone || '',
          address: rental.deliveryAddress || 'Dirección no especificada',
          boxes: rentalBoxes?.length || 0,
          rentalStatus: rental.status
        };
      }));
      
      res.json(driverTasks);
    } catch (error) {
      console.error("Error fetching driver tasks:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });
  
  // Complete a delivery/pickup task
  app.post('/api/tasks/complete', async (req, res) => {
    try {
      const { taskId, status, observations } = req.body;
      
      // Validate session
      const session = req.session as any;
      if (!session.driver) {
        return res.status(401).json({ message: "No autorizado" });
      }
      
      console.log(`Task ${taskId} completed by driver ${session.driver.id}:`, {
        status,
        observations,
        timestamp: new Date().toISOString()
      });
      
      // Update rental status based on driver completion
      let newRentalStatus = '';
      switch (status) {
        case 'entregada':
          newRentalStatus = 'entregada';
          break;
        case 'retirada':
          newRentalStatus = 'retirada';
          break;
        case 'no_entregada':
        case 'no_retirada':
        case 'incidencia':
          // Keep current status but log the incident
          newRentalStatus = '';
          break;
        default:
          newRentalStatus = '';
      }
      
      // Update rental status if needed
      if (newRentalStatus) {
        const { storage } = await import('./storage');
        await storage.updateRental(taskId, { status: newRentalStatus });
        
        // Send email notification for status change
        const { emailService } = await import('./emailService');
        if (emailService.isEmailConfigured()) {
          const rental = await storage.getRental(taskId);
          const customer = rental ? await storage.getCustomer(rental.customerId) : null;
          
          if (rental && customer) {
            const rentalBoxes = await storage.getRentalBoxes(rental.id);
            const rentalData = {
              customerName: customer.name,
              rentalId: rental.id,
              trackingCode: rental.trackingCode || '',
              trackingUrl: `https://your-domain.replit.dev/track/${customer.rut.slice(-4)}/${rental.trackingCode}`,
              totalBoxes: rentalBoxes?.length || 0,
              deliveryDate: rental.deliveryDate?.toLocaleDateString('es-CL') || '',
              deliveryAddress: rental.deliveryAddress || '',
              totalAmount: Number(rental.totalAmount) || 0,
              guaranteeAmount: Number(rental.guaranteeAmount) || 0,
            };
            
            try {
              await emailService.sendRentalStatusEmail(customer.email, newRentalStatus, rentalData);
            } catch (emailError) {
              console.error('Error sending status change email:', emailError);
            }
          }
        }
      }
      
      res.json({ 
        success: true, 
        message: "Tarea completada exitosamente",
        newStatus: newRentalStatus 
      });
    } catch (error) {
      console.error("Error completing task:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });
}