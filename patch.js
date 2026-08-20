const fs = require('fs');
const file = 'C:\\curevan_node\\src\\controllers\\products\\productsController.js';
let data = fs.readFileSync(file, 'utf8');

const targetRegex = /        \) AS variants,\s*\(\s*SELECT jsonb_build_object\(/;

const replacement = `        ) AS variants,
        (
          SELECT COALESCE(json_agg(
            jsonb_build_object(
              'id', pbi.id,
              'bundle_product_id', pbi.bundle_product_id,
              'component_product_id', pbi.component_product_id,
              'component_variant_sku', pbi.component_variant_sku,
              'quantity', pbi.quantity,
              'selling_price', pbi.selling_price,
              'discount', pbi.discount,
              'gst_slab', pbi.gst_slab,
              'component_title', cp.title,
              'component_image_url', (SELECT file_path FROM media WHERE id = cp.image_ids[1] LIMIT 1),
              'component_stock', (
                SELECT on_hand FROM inventory 
                WHERE product_id = cp.id 
                AND (sku = pbi.component_variant_sku OR pbi.component_variant_sku IS NULL OR pbi.component_variant_sku = '') 
                LIMIT 1
              )
            )
          ), '[]')
          FROM product_bundle_items pbi
          JOIN products cp ON cp.id = pbi.component_product_id
          WHERE pbi.bundle_product_id = p.id
        ) AS "bundle_items",
        (
          SELECT jsonb_build_object(`;

if(targetRegex.test(data)) {
  data = data.replace(targetRegex, replacement);
  fs.writeFileSync(file, data, 'utf8');
  console.log('Successfully patched getProductFrontendById!');
} else {
  console.log('Target string not found!');
}
