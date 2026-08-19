'use client';

import React, { useEffect, useState } from 'react';
import { fetchProductById } from '@/lib/repos/products';

export function BundleComponentsList({ productId, initialBundleItems }: { productId: number, initialBundleItems?: any[] }) {
    const [bundleItems, setBundleItems] = useState<any[]>(initialBundleItems || []);
    const [loading, setLoading] = useState(!initialBundleItems || initialBundleItems.length === 0);

    useEffect(() => {
        if (initialBundleItems && initialBundleItems.length > 0) {
            setBundleItems(initialBundleItems);
            setLoading(false);
            return;
        }

        let isMounted = true;
        const fetchItems = async () => {
            try {
                const product = await fetchProductById(String(productId));
                if (isMounted && product && (product.productType === 'Bundle' || product.product_type === 'Bundle') && product.bundleItems) {
                    setBundleItems(product.bundleItems);
                }
            } catch (error) {
                console.error("Failed to fetch bundle items for product", productId, error);
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        fetchItems();

        return () => { isMounted = false; };
    }, [productId, initialBundleItems]);

    if (loading) return <div className="text-[10px] text-muted-foreground mt-1 animate-pulse">Loading components...</div>;
    if (!bundleItems || bundleItems.length === 0) return null;

    return (
        <div className="mt-1 text-[10px] text-muted-foreground bg-muted/30 p-1.5 rounded border border-muted">
            <span className="font-semibold text-foreground mr-1">Includes:</span>
            {bundleItems.map((b, i) => (
                <span key={i}>
                    {b.component_title || b.componentTitle} <span className="font-medium text-foreground">(x{b.quantity})</span>
                    {i < bundleItems.length - 1 ? ', ' : ''}
                </span>
            ))}
        </div>
    );
}
