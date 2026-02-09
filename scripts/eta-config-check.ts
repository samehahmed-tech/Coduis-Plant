import * as dotenv from 'dotenv';

dotenv.config();

const REQUIRED = [
    'ETA_BASE_URL',
    'ETA_TOKEN_URL',
    'ETA_CLIENT_ID',
    'ETA_CLIENT_SECRET',
    'ETA_API_KEY',
    'ETA_PRIVATE_KEY',
    'ETA_RIN',
];

const OPTIONAL = [
    'ETA_PRIVATE_KEY_PASSPHRASE',
    'ETA_COMPANY_NAME',
    'ETA_BRANCH_CODE',
    'ETA_COUNTRY',
    'ETA_GOVERNATE',
    'ETA_CITY',
    'ETA_STREET',
    'ETA_BUILDING',
];

const mask = (value?: string) => {
    if (!value) return '';
    if (value.length <= 8) return '********';
    return `${value.slice(0, 4)}...${value.slice(-4)}`;
};

const main = () => {
    const missing = REQUIRED.filter((key) => !process.env[key]);
    const configuredRequired = REQUIRED.filter((key) => !!process.env[key]);
    const configuredOptional = OPTIONAL.filter((key) => !!process.env[key]);

    console.log(JSON.stringify({
        ok: missing.length === 0,
        missing,
        configuredRequired,
        configuredOptional,
        preview: Object.fromEntries(
            configuredRequired
                .filter((key) => key !== 'ETA_PRIVATE_KEY')
                .map((key) => [key, mask(process.env[key])])
        ),
    }, null, 2));

    if (missing.length > 0) {
        process.exit(1);
    }
};

main();
