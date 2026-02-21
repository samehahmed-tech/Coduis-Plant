import { readFileSync } from 'node:fs';

const inputPath = process.env.UAT_SIGNOFF_PATH || 'artifacts/uat/role-signoff.json';
const requiredRoles = ['Cashier', 'Kitchen', 'Supervisor', 'Finance', 'BranchManager'];
const acceptedStatuses = new Set(['PASS']);
const acceptedCaseResults = new Set(['PASS']);

const main = () => {
    let data: any;
    try {
        data = JSON.parse(readFileSync(inputPath, 'utf8'));
    } catch (error: any) {
        console.error(JSON.stringify({
            ok: false,
            error: 'UAT_SIGNOFF_FILE_NOT_READABLE',
            inputPath,
            details: String(error?.message || error),
        }, null, 2));
        process.exit(1);
    }

    const roles = Array.isArray(data?.roles) ? data.roles : [];
    const roleMap = new Map<string, any>();
    for (const roleEntry of roles) {
        roleMap.set(String(roleEntry?.role || ''), roleEntry);
    }

    const checks = requiredRoles.map((role) => {
        const entry = roleMap.get(role);
        const status = String(entry?.status || 'MISSING').toUpperCase();
        const testCases = Array.isArray(entry?.testCases) ? entry.testCases : [];
        const casesPassed = testCases.filter((t: any) => acceptedCaseResults.has(String(t?.result || '').toUpperCase())).length;
        const casesTotal = testCases.length;
        const hasCaseCoverage = casesTotal === 0 ? true : casesPassed === casesTotal;
        const owner = String(entry?.owner || '').trim();
        const ownerFilled = owner.length > 0;
        const ok = acceptedStatuses.has(status) && hasCaseCoverage && ownerFilled;
        return {
            role,
            status,
            owner,
            notes: entry?.notes || '',
            caseSummary: {
                total: casesTotal,
                passed: casesPassed,
            },
            ownerFilled,
            ok,
        };
    });

    const failed = checks.filter((c) => !c.ok);
    const report = {
        ok: failed.length === 0,
        inputPath,
        generatedAt: new Date().toISOString(),
        branchId: data?.branchId || null,
        checks,
        summary: {
            total: checks.length,
            passed: checks.filter((c) => c.ok).length,
            failed: failed.length,
        },
    };

    console.log(JSON.stringify(report, null, 2));
    if (!report.ok) process.exit(2);
};

main();
