const fs = require('fs');
const c = fs.readFileSync('e:/WorkSpace/restoflow-erp/components/CallCenter.tsx', 'utf8');
const lines = c.split(/\r?\n/);
lines.forEach((l, i) => {
    const t = l.trim();
    if (t.includes('tracking') || t.includes('Tracking') || t.includes('selectedTrackingOrder') || t.includes('showDriverModal') || t.includes('Dispatch') || t.includes('DELIVERED') || t.includes('updateOrderStatus')) {
        console.log((i + 1) + ': ' + t.substring(0, 130));
    }
});
