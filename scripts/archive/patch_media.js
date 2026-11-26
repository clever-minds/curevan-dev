const fs = require('fs');

const files = [
  'c:/Users/ujjaw/Downloads/curevan-24-07-2026/curevan-dev/src/app/dashboard/admin/profile-approvals/page.tsx',
  'c:/Users/ujjaw/Downloads/curevan-24-07-2026/curevan-dev/src/app/dashboard/therapy-admin/users/page.tsx',
  'c:/Users/ujjaw/Downloads/curevan-24-07-2026/curevan-dev/src/app/dashboard/admin/users/page.tsx'
];

files.forEach(f => {
  if (fs.existsSync(f)) {
    let code = fs.readFileSync(f, 'utf8');
    
    // Replace {v} with {url} in renderMedia
    const searchMedia = `return <a href={url} target="_blank" className="text-blue-600 underline" onClick={e => e.stopPropagation()}>{v}</a>;`;
    const replaceMedia = `return <a href={url} target="_blank" className="text-blue-600 underline break-all" onClick={e => e.stopPropagation()}>{url}</a>;`;
    
    if (code.includes(searchMedia)) {
      code = code.replace(searchMedia, replaceMedia);
      fs.writeFileSync(f, code, 'utf8');
      console.log('Patched media in', f);
    }
  }
});
