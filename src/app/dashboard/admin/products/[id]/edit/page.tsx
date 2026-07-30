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
        <h1 className="text-2xl font-bold tracking-tight font-headline">Edit Product</h1>
        <p className="text-muted-foreground">
          Update the product details, pricing, and inventory information.
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
              category: (product.category_id || product.categoryId) ? String(product.category_id || product.categoryId) : undefined,
              mrp: product.mrp,
              sellingPrice: product.selling_price || product.sellingPrice,
              status: product.status,
              stock: product.on_hand || product.stock,
              reorderPoint: product.reorder_point || product.reorderPoint,
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
              additionalFeatures: product.additional_features?.map((f: any) => ({
                title: f.title,
                value: f.value,
                isHighlighted: f.is_highlighted,
              })) || [],
              isRecommended: product.is_recommended || product.isRecommended,
              serviceTypeId: product.service_type_id || product.serviceTypeId,
              hasVariants: (product.variants && product.variants.length > 0) ? true : false,
              variants: product.variants?.map((v: any) => ({
                sku: v.sku,
                mrp: v.mrp || 0,
                sellingPrice: v.selling_price || v.sellingPrice || 0,
                stock: v.stock || 0,
                attributes: v.attributes || {},
              })) || [],
              bundleItems: (product.bundle_items || product.bundleItems)?.map((item: any) => ({
                componentProductId: item.component_product_id || item.componentProductId,
                componentVariantSku: item.component_variant_sku || item.componentVariantSku,
                quantity: item.quantity,
              })) || [],
              subCategory: (product.sub_category_id || product.subCategoryId) ? String(product.sub_category_id || product.subCategoryId) : undefined,
            }}
          />
          </CardContent>
        </Card>
    </div>
  );
}
