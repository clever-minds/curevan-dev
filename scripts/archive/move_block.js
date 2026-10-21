const fs = require('fs');

const path = 'src/app/dashboard/admin/products/product-form.tsx';
let content = fs.readFileSync(path, 'utf-8');

const lines = content.split('\n');

const startIndex = lines.findIndex(l => l.includes('Pricing & Taxes')) - 3;
const endIndex = startIndex + 18; // 640 to 658

if (lines[startIndex].includes('!form.watch("hasVariants")') && lines[endIndex].includes(')}')) {
    const block = lines.splice(startIndex, endIndex - startIndex + 1);
    
    // Find where Bundle Components ends
    const bundleEndIndex = lines.findIndex((l, i) => i > startIndex && l.includes('productType === \'Bundle\'') ? true : false); // wait
    // Actually just find `<h3 className="text-lg font-medium font-headline">Bundle Components</h3>`
    const bundleTitleIndex = lines.findIndex(l => l.includes('Bundle Components'));
    let insertIndex = bundleTitleIndex;
    while(insertIndex < lines.length && !lines[insertIndex].includes('</>')) {
        insertIndex++;
    }
    // After `</>` is `)}`
    if (lines[insertIndex + 1] && lines[insertIndex + 1].includes(')}')) {
        insertIndex += 2;
    }
    
    lines.splice(insertIndex, 0, ...block);
    fs.writeFileSync(path, lines.join('\n'), 'utf-8');
    console.log("Moved successfully.");
} else {
    console.log("Failed to find bounds.");
}
