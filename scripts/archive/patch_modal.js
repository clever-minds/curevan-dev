const fs = require('fs');
const files = [
  'c:/Users/ujjaw/Downloads/curevan-24-07-2026/curevan-dev/src/app/dashboard/admin/profile-approvals/page.tsx',
  'c:/Users/ujjaw/Downloads/curevan-24-07-2026/curevan-dev/src/app/dashboard/therapy-admin/users/page.tsx',
  'c:/Users/ujjaw/Downloads/curevan-24-07-2026/curevan-dev/src/app/dashboard/admin/users/page.tsx'
];

files.forEach(f => {
  if (fs.existsSync(f)) {
    let code = fs.readFileSync(f, 'utf8');
    if (code.includes('const formatValue =')) {
      // 1. Fix specialty / service array names mapping
      const searchSpecialty = `if (lowerName.includes('specialty')) {
                   if (Array.isArray(val)) {
                       return val.map((id: any) => categoryMap.get(Number(id)) || id).join(', ');
                   }
                   return categoryMap.get(Number(val)) || String(val);
               }`;
               
      const replaceSpecialty = `if (lowerName.includes('specialty') || lowerName.includes('service') || lowerName.includes('categor')) {
                   let arr = val;
                   if (typeof val === 'string') {
                       if (val.startsWith('[')) {
                           try { arr = JSON.parse(val); } catch(e) {}
                       } else if (val.includes(',')) {
                           arr = val.split(',').map(s => s.trim());
                       }
                   }
                   if (Array.isArray(arr)) {
                       return arr.map((id: any) => categoryMap.get(Number(id)) || id).join(', ');
                   }
                   return categoryMap.get(Number(val)) || String(val);
               }`;
               
      if (code.includes(searchSpecialty)) {
        code = code.replace(searchSpecialty, replaceSpecialty);
      } else {
        // use regex if slight difference
        code = code.replace(/if\s*\(\s*lowerName\.includes\('specialty'\)\s*\)\s*\{[\s\S]*?return\s*categoryMap\.get\(Number\(val\)\)\s*\|\|\s*String\(val\);\s*\}/, replaceSpecialty);
      }

      // 2. Fix media URL showing up instead of just ID
      const searchMedia = `const renderMedia = (v: any) => {
                       const url = getMediaUrl(v);
                       return <a href={url} target="_blank" className="text-blue-600 underline" onClick={e => e.stopPropagation()}>{v}</a>;
                   };`;
                   
      const replaceMedia = `const renderMedia = (v: any) => {
                       const url = getMediaUrl(v);
                       return <a href={url} target="_blank" className="text-blue-600 underline break-all" onClick={e => e.stopPropagation()}>{url}</a>;
                   };`;
                   
      if (code.includes(searchMedia)) {
        code = code.replace(searchMedia, replaceMedia);
      } else {
        // fallback regex
        code = code.replace(/const renderMedia = \(v: any\) => \{[\s\S]*?return <a href=\{url\}[^>]*>\{v\}<\/a>;\s*\};/, replaceMedia);
      }

      fs.writeFileSync(f, code, 'utf8');
      console.log('Patched', f);
    }
  }
});
