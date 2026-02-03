import { db } from './server/db';
import { users, branches, shifts, settings } from './src/db/schema';

async function diagnose() {
    try {
        console.log('--- Database Diagnosis ---');

        const allUsers = await db.select().from(users);
        console.log(`Users: ${allUsers.length}`);
        allUsers.forEach(u => console.log(` - ${u.id}: ${u.email} (${u.role})`));

        const allBranches = await db.select().from(branches);
        console.log(`Branches: ${allBranches.length}`);
        allBranches.forEach(b => console.log(` - ${b.id}: ${b.name}`));

        const allShifts = await db.select().from(shifts);
        console.log(`Shifts: ${allShifts.length}`);

        const allSettings = await db.select().from(settings);
        console.log(`Settings entries: ${allSettings.length}`);

        console.log('--- End Diagnosis ---');
        process.exit(0);
    } catch (error) {
        console.error('Diagnosis failed:', error);
        process.exit(1);
    }
}

diagnose();
