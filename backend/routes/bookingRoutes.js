import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  createEquipmentBooking, createTransportBooking, myEquipmentBookings, myTransportBookings,
  updateEquipmentBooking, updateTransportBooking
} from '../controllers/bookingController.js';

export const equipmentBookingRouter = Router();
equipmentBookingRouter.use(authenticate);
equipmentBookingRouter.get('/my', myEquipmentBookings);
equipmentBookingRouter.post('/', createEquipmentBooking);
equipmentBookingRouter.patch('/:id', updateEquipmentBooking);

export const transportBookingRouter = Router();
transportBookingRouter.use(authenticate);
transportBookingRouter.get('/my', myTransportBookings);
transportBookingRouter.post('/', createTransportBooking);
transportBookingRouter.patch('/:id', updateTransportBooking);
