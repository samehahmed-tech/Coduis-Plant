/* ═══════════════════════════════════════════════════════════════════════════
   Receipt Image Renderer — renders HTML receipt to base64 PNG for thermal
   printers. Enables full Arabic + styled printing via raster mode.
   ═══════════════════════════════════════════════════════════════════════════ */

import html2canvas from 'html2canvas';

/**
 * Render an HTML receipt string into a base64-encoded PNG image.
 * The image is sized to match the thermal printer paper width.
 *
 * @param html     Full HTML string (with <head>, <body>, etc.)
 * @param widthPx  Target width in pixels (58mm ≈ 384px, 80mm ≈ 576px)
 * @returns        base64-encoded PNG string (no data: prefix)
 */
export const renderReceiptToImage = async (
    html: string,
    widthPx: number = 576 // default 80mm
): Promise<string> => {
    // Create a hidden container
    const container = document.createElement('div');
    container.style.cssText = `
        position: fixed;
        left: -9999px;
        top: 0;
        width: ${widthPx}px;
        background: white;
        font-family: 'Cairo', 'Segoe UI', sans-serif;
        color: #000;
        z-index: -1;
    `;

    // Extract body content from full HTML
    const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    const bodyContent = bodyMatch ? bodyMatch[1] : html;
    const htmlDirMatch = html.match(/<html[^>]*\sdir=["']([^"']+)["']/i);
    const bodyDirMatch = html.match(/<body[^>]*\sdir=["']([^"']+)["']/i);
    const contentDir = bodyDirMatch?.[1] || htmlDirMatch?.[1] || 'ltr';

    // Also extract and apply <style> tags
    const styleMatches = html.match(/<style[^>]*>([\s\S]*?)<\/style>/gi);
    if (styleMatches) {
        const styleEl = document.createElement('style');
        const rawStyles = styleMatches
            .map(s => s.replace(/<\/?style[^>]*>/gi, ''))
            .join('\n');
        styleEl.textContent = `${rawStyles}\n${rawStyles.replace(/\bbody\b/g, '.receipt-print-root')}`;
        container.appendChild(styleEl);
    }

    const content = document.createElement('div');
    content.className = 'receipt-print-root';
    content.dir = contentDir as 'ltr' | 'rtl' | 'auto';
    content.innerHTML = bodyContent;
    content.style.width = `${widthPx}px`;
    container.appendChild(content);

    document.body.appendChild(container);

    try {
        // Render to canvas
        const canvas = await html2canvas(content, {
            width: widthPx,
            backgroundColor: '#ffffff',
            scale: 2, // 2x for sharper output
            useCORS: true,
            logging: false,
        });

        // Convert to base64 PNG
        const dataUrl = canvas.toDataURL('image/png');
        // Strip the data:image/png;base64, prefix
        return dataUrl.replace(/^data:image\/png;base64,/, '');
    } finally {
        document.body.removeChild(container);
    }
};

/**
 * Convenience: given HTML receipt + printer paper size, render and return
 * a payload ready to send to the print bridge.
 */
export const createImagePrintPayload = async (
    html: string,
    paperWidth: '58mm' | '80mm' = '80mm'
): Promise<{ content: string; contentType: 'image' }> => {
    const widthPx = paperWidth === '58mm' ? 384 : 576;
    const base64Image = await renderReceiptToImage(html, widthPx);
    return {
        content: base64Image,
        contentType: 'image',
    };
};
