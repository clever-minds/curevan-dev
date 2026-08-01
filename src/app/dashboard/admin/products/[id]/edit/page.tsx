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
              productType: (() => {
                const pt = product.product_type || product.productType;
                if (!pt) return undefined;
                const lowerPt = pt.toLowerCase();
                if (lowerPt.includes('physical')) return 'Physical';
                if (lowerPt.includes('digital')) return 'Digital';
                if (lowerPt.includes('service')) return 'Service';
                if (lowerPt.includes('bundle')) return 'Bundle';
                return pt;
              })(),
              hsnCode: product.hsn_code || product.hsnCode,
              sacCode: product.sac_code || product.sacCode,
              gstSlab: product.gst_slab || product.gstSlab,
              isTaxInclusive: product.is_tax_inclusive !== undefined ? product.is_tax_inclusive : (product.isTaxInclusive !== undefined ? product.isTaxInclusive : true),
              isCouponExcluded: product.is_coupon_excluded !== undefined ? product.is_coupon_excluded : (product.isCouponExcluded !== undefined ? product.isCouponExcluded : false),
              tags: product.tags || [],
              subtitle: product.subtitle,
              shortDescription: product.short_description || product.shortDescription,
              longDescription: product.long_description || product.longDescription,
              sku: product.sku,
              category: (() => {
                const cat = product.category_id || product.categoryId || (typeof product.category === 'object' ? product.category?.id : product.category);
                return cat ? String(cat) : undefined;
              })(),
              subCategory: (() => {
                const subCat = product.sub_category_id || product.subCategoryId || (typeof product.sub_category === 'object' ? product.sub_category?.id : product.sub_category) || (typeof product.subCategory === 'object' ? product.subCategory?.id : product.subCategory);
                return subCat ? String(subCat) : undefined;
              })(),
              mrp: product.mrp,
              sellingPrice: product.selling_price || product.sellingPrice,
              status: product.status,
              stock: product.on_hand || product.stock,
              reorderPoint: product.reorder_point || product.reorderPoint,
              brand: product.brand,
              images: product.images || [],
              dimensions: {
                lengthCm: product.length_cm || product.dimensions?.lengthCm,
                widthCm: product.width_cm || product.dimensions?.widthCm,
                heightCm: product.height_cm || product.dimensions?.heightCm,
                weightKg: product.weight_kg || product.dimensions?.weightKg,
              },
              manufacturer: product.manufacturer,
              countryOfOrigin: product.country_of_origin || product.countryOfOrigin,
              packer: product.packer,
              importer: product.importer,
              batchNumber: product.batch_number || product.batchNumber,
              mfgDate: (product.manufacturing_date || product.mfgDate) ? new Date(product.manufacturing_date || product.mfgDate) : undefined,
              expiryDate: (product.expiry_date || product.expiryDate) ? new Date(product.expiry_date || product.expiryDate) : undefined,
              additionalFeatures: (product.additional_features || product.additionalFeatures)?.map((f: any) => ({
                title: f.title,
                value: f.value,
                isHighlighted: f.is_highlighted || f.isHighlighted,
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
                image: (v.imageId || v.image_id) && v.imageUrl ? [{ id: v.imageId || v.image_id, url: v.imageUrl, type: 'image' }] : [],
              })) || [],
              bundleItems: (product.bundleItems || product.bundle_items || product.bundle_items_data)?.map((item: any) => ({
                componentProductId: item.componentProductId || item.component_product_id,
                componentVariantSku: item.componentVariantSku || item.component_variant_sku,
                quantity: item.quantity,
              })) || [],
            }}
          />
          </CardContent>
        </Card>
    </div>
  );
}
