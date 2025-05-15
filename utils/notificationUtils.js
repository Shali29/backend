import {
  createSupplierNotification,
  createDriverNotification,
} from '../controllers/NotificationController.js';

export async function sendNotificationToSupplier(supplierId, message) {
  try {
    await createSupplierNotification(supplierId, message);
    console.log(`Notification sent to supplier ${supplierId}: ${message}`);
  } catch (error) {
    console.error('Failed to send notification to supplier:', error);
  }
}

export async function sendNotificationToDriver(driverId, message) {
  try {
    await createDriverNotification(driverId, message);
    console.log(`Notification sent to driver ${driverId}: ${message}`);
  } catch (error) {
    console.error('Failed to send notification to driver:', error);
  }
}
