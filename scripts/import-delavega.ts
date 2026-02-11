import { db } from '../server/db';
import { menuCategories, menuItems } from '../src/db/schema';
import * as fs from 'fs';
import * as path from 'path';
import { pathToFileURL } from 'url';

// Define the source data structure since we can't easily import from an external path with different types
interface SourceItem {
    id: string;
    nameEn: string;
    nameAr: string;
    price: number;
    descriptionEn?: string;
    descriptionAr?: string;
}

interface SourceCategory {
    id: string;
    titleEn: string;
    titleAr: string;
    icon?: string;
    themeColor?: string;
    type?: string;
    coverImage?: string;
    items: SourceItem[];
}

const DEFAULT_ITEM_IMAGE = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=1000&auto=format&fit=crop';

async function importData() {
    const tempSourcePath = path.resolve('./scripts/temp_data.ts');
    try {
        console.log('--- De La Vega Menu Import Started ---');

        // Path to the data.ts file provided by the user
        // We'll manually extract the data structure or use a regex-based approach if we can't import it directly
        // actually, I'll just paste the data here or read it and eval it for simplicity since I have the content

        // For this task, I'll parse the content I read earlier.
        // But since I'm writing a script to be run, I'll just hardcode the logic to process the categories

        // I will read the file content and try to extract the array
        const filePath = 'c:/Users/S A M E H/Downloads/delavega-3d-menu (2)/data.ts';
        const fileContent = fs.readFileSync(filePath, 'utf-8');

        // Since it's a TS file with exports, we might need to be careful.
        // A safer way is to just assume the MENU_DATA is what we want.
        // For the sake of this agent, I'll construct the categories array.

        // NOTE: In a real scenario, I'd dynamic import but here I'll just use a simplified version of the data 
        // Or I can use a regex to extract the JSON-like structure.

        // Actually, I'll just use the content I saw in view_file and construct a helper function 
        // to parse it if I were to run it. 
        // But better: I'll use the environment's `tsx` to run this script.

        console.log('Reading source file...');

        // I'll use a hacky but effective way to get the data: 
        // Copy the data.ts to a temp file in the project, fix imports, and import it.
        let refinedContent = fileContent.replace(/import { MenuCategory } from '.\/types';/, 'export interface MenuItem { id: string; nameEn: string; nameAr: string; price: number; descriptionEn?: string; descriptionAr?: string; } export interface MenuCategory { id: string; titleEn: string; titleAr: string; icon?: string; themeColor?: string; type?: string; coverImage?: string; items: MenuItem[]; }');
        fs.writeFileSync(tempSourcePath, refinedContent);

        const tempUrl = `${pathToFileURL(tempSourcePath).href}?v=${Date.now()}`;
        const { MENU_DATA } = await import(tempUrl);
        const sourceData = MENU_DATA as SourceCategory[];

        console.log(`Found ${sourceData.length} categories to import.`);

        let categoryCount = 0;
        let itemCount = 0;

        for (const cat of sourceData) {
            const catId = `cat_dlv_${cat.id}`;

            console.log(`Importing category: ${cat.titleEn} (${cat.titleAr})`);

            await db.insert(menuCategories).values({
                id: catId,
                name: cat.titleEn,
                nameAr: cat.titleAr,
                image: cat.coverImage || '',
                icon: cat.icon || 'Utensils',
                color: cat.themeColor || '#6366f1',
                isActive: true,
                sortOrder: categoryCount++,
            }).onConflictDoUpdate({
                target: menuCategories.id,
                set: {
                    name: cat.titleEn,
                    nameAr: cat.titleAr,
                    image: cat.coverImage || '',
                }
            });

            for (const item of cat.items) {
                const itemId = `item_dlv_${item.id}`;

                // console.log(`  Importing item: ${item.nameEn}`);

                await db.insert(menuItems).values({
                    id: itemId,
                    categoryId: catId,
                    name: item.nameEn,
                    nameAr: item.nameAr,
                    description: item.descriptionEn || '',
                    descriptionAr: item.descriptionAr || '',
                    price: item.price,
                    image: DEFAULT_ITEM_IMAGE, // Default image as requested
                    isAvailable: true,
                    sortOrder: itemCount++,
                }).onConflictDoUpdate({
                    target: menuItems.id,
                    set: {
                        name: item.nameEn,
                        nameAr: item.nameAr,
                        price: item.price,
                        description: item.descriptionEn || '',
                        descriptionAr: item.descriptionAr || '',
                    }
                });
            }
        }

        console.log(`Successfully imported ${categoryCount} categories and ${itemCount} items.`);
        process.exit(0);
    } catch (error) {
        console.error('Import failed:', error);
        process.exit(1);
    } finally {
        if (fs.existsSync(tempSourcePath)) {
            fs.unlinkSync(tempSourcePath);
        }
    }
}

importData();
