import fs from 'node:fs';
import path from 'node:path';

const deepMerge = (base: any, current: any): any => {
  if (Array.isArray(base)) {
    if (!Array.isArray(current) || current.length === 0) return base;
    // Merge role arrays by "role" key when possible; otherwise keep current.
    if (base.every((x) => x && typeof x === 'object' && 'role' in x)) {
      const byRole = new Map<string, any>();
      for (const item of current) byRole.set(String(item?.role || ''), item);
      return base.map((item) => deepMerge(item, byRole.get(String(item.role || '')) || {}));
    }
    if (base.every((x) => x && typeof x === 'object' && 'id' in x)) {
      const byId = new Map<string, any>();
      for (const item of current) byId.set(String(item?.id || ''), item);
      return base.map((item) => deepMerge(item, byId.get(String(item.id || '')) || {}));
    }
    return current;
  }

  if (base && typeof base === 'object') {
    const output: Record<string, any> = {};
    const keys = new Set([...Object.keys(base), ...Object.keys(current || {})]);
    for (const key of keys) {
      if (current && Object.prototype.hasOwnProperty.call(current, key)) {
        output[key] = deepMerge(base[key], current[key]);
      } else {
        output[key] = base[key];
      }
    }
    return output;
  }

  return current !== undefined ? current : base;
};

const syncOne = (templatePath: string, targetPath: string) => {
  const template = JSON.parse(fs.readFileSync(templatePath, 'utf8'));
  let current: any = {};
  if (fs.existsSync(targetPath)) {
    current = JSON.parse(fs.readFileSync(targetPath, 'utf8'));
  }
  const merged = deepMerge(template, current);
  fs.mkdirSync(path.dirname(targetPath), { recursive: true });
  fs.writeFileSync(targetPath, JSON.stringify(merged, null, 2), 'utf8');
  return { templatePath, targetPath, ok: true };
};

const main = () => {
  const results = [
    syncOne('docs/UAT_ROLE_SIGNOFF_TEMPLATE.json', 'artifacts/uat/role-signoff.json'),
    syncOne('docs/ROLLBACK_DRILL_TEMPLATE.json', 'artifacts/rollback/drill-report.json'),
  ];
  console.log(JSON.stringify({ ok: true, generatedAt: new Date().toISOString(), results }, null, 2));
};

main();
