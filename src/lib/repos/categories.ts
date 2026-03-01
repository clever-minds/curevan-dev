

'use server';

import { db } from '@/lib/db';
import type { ProductCategory } from '../types';

export async function listProductCategories1(): Promise<ProductCategory[]> {
    const snapshot = await db.collection('productCategories').get();
    if (snapshot.empty) return [];
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ProductCategory));
}

export async function getTherapyCategories(): Promise<string[]> {
    // In a real app, this might also come from a 'therapyCategories' collection
    return [
      'Physiotherapy', 'Nursing Care', 'Geri care Therapy', 'Speech Therapy',
      'Mental Health Counseling', 'Dietitian/Nutritionist', 'Respiratory Therapy', 'Acupuncture',
      'Operations', 'Earnings', 'Clinical'
    ];
}
