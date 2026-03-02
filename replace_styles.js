const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.resolve(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(file));
        } else {
            results.push(file);
        }
    });
    return results;
}

const files = walk('./components').filter(f => f.endsWith('.tsx'));
console.log(`Found ${files.length} files.`);
files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let newContent = content.replace(/bg-white\s+dark:bg-slate-\d+(\s+border\s+border-slate-\d+\s+dark:border-slate-\d+)?/g, 'card-primary');
    if (content !== newContent) {
        fs.writeFileSync(file, newContent);
        console.log('Updated ' + file);
    }
});
console.log('Done');
