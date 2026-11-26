const fs = require('fs');
const filePath = 'src/app/dashboard/admin/products/product-form.tsx';
let content = fs.readFileSync(filePath, 'utf-8');

const startStr = '        watchedBundleItems.forEach((item: any) => {';
const endStr = '        });\n  \n        console.log(`FINAL TOTALS: totalMrp=${totalMrp}, totalSellingPrice=${totalSellingPrice}`);';

const startIndex = content.indexOf(startStr);
const endIndex = content.indexOf(endStr);

if (startIndex !== -1 && endIndex !== -1) {
  const oldBlock = content.substring(startIndex, endIndex + '        });'.length);
  
  const newBlock = `        watchedBundleItems.forEach((item: any) => {
          if (item.componentProductId) {
            const qty = Number(item.quantity) || 1;
            const sp = Number(item.sellingPrice) || 0;
            const disc = Number(item.discount) || 0;
            const gst = Number(item.gstSlab) || 0;
            
            const discountedPrice = Math.max(0, sp - disc);
            const gstAmount = discountedPrice * (gst / 100);
            const rowFinalAmount = (discountedPrice + gstAmount) * qty;

            console.log(\`Adding to total: SP \${sp} * qty \${qty}, FinalAmount \${rowFinalAmount}\`);
            totalMrp += sp * qty;
            totalSellingPrice += rowFinalAmount;
            
            if (gst > maxGst) {
              maxGst = gst;
            }
          }
        });`;

  content = content.replace(oldBlock, newBlock);
  fs.writeFileSync(filePath, content, 'utf-8');
  console.log("Success");
} else {
  console.log("Could not find bounds", startIndex, endIndex);
}
