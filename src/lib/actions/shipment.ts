
'use server';

import { db } from '@/lib/db';
import type { Order, Shipment } from '../types';
import { FieldValue } from 'firebase-admin/firestore';
import { getOrderById } from '../repos/orders';
import { addAuditLog } from '../repos/logs';

/**
 * Simulates creating a shipment with a logistics provider like Shiprocket.
 * In a real app, this would make an authenticated API call.
 * This action is idempotent; it won't create a shipment if one already exists.
 *
 * @param orderId The ID of the order to ship.
 * @returns An object indicating success or failure, and the new shipment data.
 */
export async function createShipment(
  orderId: number
): Promise<{ success: boolean; shipment?: Shipment; error?: string }> {
  try {
    const order = await getOrderById(orderId);

    if (!order) {
      return { success: false, error: 'Order not found.' };
    }

    if (order.status === 'Shipped' || order.status === 'Delivered' || order.status === 'Cancelled') {
      return { success: false, error: `Order is already in "${order.status}" status.` };
    }

    // --- Simulate Shiprocket API Call ---
    console.log(`Authenticating with Shiprocket using email: ${process.env.SHIPROCKET_API_EMAIL}`);
    console.log('Constructing shipment payload with order details...');
    // In a real scenario, you'd make a POST request here.
    const mockApiResponse = {
        shipment_id: Math.floor(Math.random() * 90000) + 10000,
        awb_code: `CUREVAN${Math.floor(Math.random() * 900000) + 100000}`,
        courier_name: 'Delhivery',
        label_url: 'https://shiprocket.fake/label.pdf',
        manifest_url: 'https://shiprocket.fake/manifest.pdf',
    }
    console.log('Shiprocket API call successful:', mockApiResponse);

    // --- Create and Save Shipment Document ---
    const shipmentRef = db.collection('shipments').doc();
    const newShipment: Shipment = {
      id: shipmentRef.id,
      orderId: order.id,
      awb: mockApiResponse.awb_code,
      carrier: mockApiResponse.courier_name,
      createdAt: new Date().toISOString(),
      customerName: order.customerName,
      cityState: `${order.shippingAddress.city}, ${order.shippingAddress.state}`,
      status: 'Pending Pickup',
      eta: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days from now
      slaBreached: false,
      labelUrl: mockApiResponse.label_url,
      manifestUrl: mockApiResponse.manifest_url,
      provider: 'shiprocket',
      shiprocketShipmentId: mockApiResponse.shipment_id,
    };
    
    // Use a batch to update order and create shipment atomically
    const batch = db.batch();
    batch.set(shipmentRef, newShipment);

    const orderRef = db.collection('orders').doc(order.id);
    batch.update(orderRef, { status: 'Packed' });
    
    await batch.commit();

    await addAuditLog({
        actorId: 'system', // or the admin user's ID
        action: 'order.shipped',
        entityType: 'order',
        entityId: order.id,
        details: { awb: newShipment.awb, carrier: newShipment.carrier, shipmentId: newShipment.id }
    })
    
    return { success: true, shipment: newShipment };

  } catch (error) {
    console.error('Error creating shipment:', error);
    return { success: false, error: 'An unexpected error occurred while creating the shipment.' };
  }
}

