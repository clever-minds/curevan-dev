
'use server';

import { db } from '@/lib/db';

/**
 * Fetches public-facing statistics using efficient aggregate queries.
 * This function is designed to be called from Server Components or API routes.
 * 
 * In a high-traffic production app, these values should ideally be pre-computed
 * and stored in a dedicated document (e.g., 'publicMetrics/totals') which is
 * updated by Cloud Functions listening to writes on the respective collections.
 * For this implementation, we use aggregate queries for simplicity and efficiency.
 * 
 * @returns An object containing key statistics about the platform.
 */
export async function getPublicStats() {
    try {
        const usersQuery = db.collection('users').where('role', '==', 'patient');
        const therapistsQuery = db.collection('therapistProfiles'); // No status field on this collection in seed data
        const productsQuery = db.collection('products').where('isActive', '==', true);
        const patientsServedQuery = db.collection('appointments').where('status', '==', 'Completed');
        const productsDeliveredQuery = db.collection('orders').where('status', '==', 'Delivered');

        const [
            usersSnapshot,
            therapistsSnapshot,
            productsSnapshot,
            patientsServedSnapshot,
            productsDeliveredSnapshot
        ] = await Promise.all([
            usersQuery.count().get(),
            therapistsQuery.count().get(),
            productsQuery.count().get(),
            patientsServedQuery.count().get(),
            productsDeliveredQuery.count().get()
        ]);

        return {
            usersTotal: usersSnapshot.data().count,
            therapistsTotal: therapistsSnapshot.data().count,
            productsTotal: productsSnapshot.data().count,
            patientsServedTotal: patientsServedSnapshot.data().count,
            productsDeliveredTotal: productsDeliveredSnapshot.data().count,
        };
    } catch (error) {
        console.error("Error fetching public stats:", error);
        // Return a default or cached state in case of error
        return {
            usersTotal: 0,
            therapistsTotal: 0,
            productsTotal: 0,
            patientsServedTotal: 0,
            productsDeliveredTotal: 0,
        };
    }
}
