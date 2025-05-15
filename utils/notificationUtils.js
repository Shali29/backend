import { createNotification } from '../controllers/NotificationController.js';

// Utility function to send notification (call this from other controllers)
export async function sendNotificationToSupplier(supplierId, message) {
  try {
    await createNotification(supplierId, message);
    console.log(`Notification sent to supplier ${supplierId}: ${message}`);
  } catch (error) {
    console.error('Failed to send notification:', error);
  }
}
