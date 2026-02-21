import { readFileSync } from 'node:fs';

const inputPath = process.env.ROLLBACK_DRILL_PATH || 'artifacts/rollback/drill-report.json';

const parseTs = (value: any) => {
    const time = new Date(String(value || '')).getTime();
    return Number.isFinite(time) ? time : NaN;
};

const minutesBetween = (fromTs: number, toTs: number) => {
    if (!Number.isFinite(fromTs) || !Number.isFinite(toTs) || toTs < fromTs) return NaN;
    return (toTs - fromTs) / 60000;
};

const main = () => {
    let data: any;
    try {
        data = JSON.parse(readFileSync(inputPath, 'utf8'));
    } catch (error: any) {
        console.error(JSON.stringify({
            ok: false,
            error: 'ROLLBACK_DRILL_FILE_NOT_READABLE',
            inputPath,
            details: String(error?.message || error),
        }, null, 2));
        process.exit(1);
    }

    const incidentStartAt = parseTs(data?.incidentStartAt);
    const decisionAt = parseTs(data?.decisionAt);
    const rollbackStartAt = parseTs(data?.rollbackStartAt);
    const rollbackEndAt = parseTs(data?.rollbackEndAt);
    const recoveryVerifiedAt = parseTs(data?.recoveryVerifiedAt);

    const timingObj = data?.timing || {};
    const computedDetectionToRollbackStart = minutesBetween(incidentStartAt, rollbackStartAt);
    const computedRollbackDuration = minutesBetween(rollbackStartAt, rollbackEndAt);
    const computedRecoveryVerificationDuration = minutesBetween(rollbackEndAt, recoveryVerifiedAt);

    const hasExplicitTiming = (value: any) => value !== null && value !== '' && value !== undefined && Number.isFinite(Number(value));
    const detectionToRollbackStart = hasExplicitTiming(timingObj?.detectionToRollbackStartMinutes)
        ? Number(timingObj.detectionToRollbackStartMinutes)
        : computedDetectionToRollbackStart;
    const rollbackDuration = hasExplicitTiming(timingObj?.rollbackDurationMinutes)
        ? Number(timingObj.rollbackDurationMinutes)
        : computedRollbackDuration;
    const recoveryVerificationDuration = hasExplicitTiming(timingObj?.recoveryVerificationMinutes)
        ? Number(timingObj.recoveryVerificationMinutes)
        : computedRecoveryVerificationDuration;

    const checks = {
        timing: {
            detectionToRollbackStart: {
                value: detectionToRollbackStart,
                threshold: 5,
                ok: Number.isFinite(detectionToRollbackStart) && detectionToRollbackStart <= 5,
            },
            rollbackDuration: {
                value: rollbackDuration,
                threshold: 15,
                ok: Number.isFinite(rollbackDuration) && rollbackDuration <= 15,
            },
            recoveryVerificationDuration: {
                value: recoveryVerificationDuration,
                threshold: 10,
                ok: Number.isFinite(recoveryVerificationDuration) && recoveryVerificationDuration <= 10,
            },
        },
        dataIntegrity: {
            checksPassed: data?.dataIntegrityChecksPassed === true,
            noDuplicateOrders: data?.duplicateOrdersDetected !== true,
            orderCountStable: Number(data?.ordersCountBefore) === Number(data?.ordersCountAfter),
            paymentsStable: Number(data?.paymentsTotalBefore) === Number(data?.paymentsTotalAfter),
        },
        approvals: {
            ops: Boolean(String(data?.approvedBy?.ops || '').trim()),
            product: Boolean(String(data?.approvedBy?.product || '').trim()),
        },
        checklist: {
            total: Array.isArray(data?.checklist) ? data.checklist.length : 0,
            completed: Array.isArray(data?.checklist) ? data.checklist.filter((c: any) => c?.completed === true).length : 0,
            ok: Array.isArray(data?.checklist) ? data.checklist.length > 0 && data.checklist.every((c: any) => c?.completed === true) : true,
        },
    };

    const ok =
        checks.timing.detectionToRollbackStart.ok &&
        checks.timing.rollbackDuration.ok &&
        checks.timing.recoveryVerificationDuration.ok &&
        checks.dataIntegrity.checksPassed &&
        checks.dataIntegrity.noDuplicateOrders &&
        checks.dataIntegrity.orderCountStable &&
        checks.dataIntegrity.paymentsStable &&
        checks.checklist.ok &&
        checks.approvals.ops &&
        checks.approvals.product;

    const report = {
        ok,
        inputPath,
        generatedAt: new Date().toISOString(),
        checks,
    };

    console.log(JSON.stringify(report, null, 2));
    if (!ok) process.exit(2);
};

main();
