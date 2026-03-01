'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { getProductById } from '@/lib/api/products';
import { ProductForm } from '../../product-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function EditProductPage() {
  const { id } = useParams();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    const fetchProduct = async () => {
      try {
        const productId = Array.isArray(id) ? id[0] : id;
        const data = await getProductById(productId);
        setProduct(data);
      } catch (err) {
        console.error('Error fetching product', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  if (loading) return <div>Loading...</div>;
  if (!product) return <div>Product not found</div>;

  return (
     <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight font-headline">Add New Product</h1>
        <p className="text-muted-foreground">
          Fill out the form below to add a new product, service, or bundle to your store.
        </p>
      </div>
      <Card>
        <CardContent className="pt-6">
          <ProductForm
            productId={product.id}
            initialData={{
              title: product.title,
              productType: product.product_type,
              hsnCode: product.hsn_code,
              sacCode: product.sac_code,
              gstSlab: product.gst_slab,
              isTaxInclusive: product.is_tax_inclusive,
              isCouponExcluded: product.is_coupon_excluded,
              tags: product.tags ||[],
              subtitle: product.subtitle,
              shortDescription: product.short_description,
              longDescription: product.long_description,
              sku: product.sku,
              category: String(product.category_id),
              mrp: product.mrp,
              sellingPrice: product.selling_price,
              status: product.status,
              stock: product.on_hand,
              reorderPoint: product.reorder_point,
              brand: product.brand,
              images: product.images || [],
              dimensions: {
                lengthCm: product.length_cm,
                widthCm: product.width_cm,
                heightCm: product.height_cm,
                weightKg: product.weight_kg,
              },
              manufacturer: product.manufacturer,
              countryOfOrigin: product.country_of_origin,
              packer: product.packer,
              importer: product.importer,
              batchNumber: product.batch_number,
              mfgDate: product.manufacturing_date ? new Date(product.manufacturing_date) : undefined,
              expiryDate: product.expiry_date ? new Date(product.expiry_date) : undefined,
            }}
          />
          </CardContent>
        </Card>
    </div>
  );
}
