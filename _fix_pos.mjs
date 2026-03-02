import { readFileSync, writeFileSync } from 'fs';

const filePath = 'e:/WorkSpace/restoflow-erp/components/POS.tsx';
let content = readFileSync(filePath, 'utf8');

const regex = /\{\/\* ═══ Category Sidebar \(Desktop\) ═══ \*\/\}\s*<CategorySidebar[\s\S]*?\/>/;

if (regex.test(content)) {
    content = content.replace(regex, '');
    writeFileSync(filePath, content, 'utf8');
    console.log('CategorySidebar removed successfully from POS.tsx');
} else {
    console.log('CategorySidebar not found!');
}
