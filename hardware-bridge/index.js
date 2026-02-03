const express = require('express');
const escpos = require('escpos');
escpos.USB = require('escpos-usb');
escpos.Network = require('escpos-network');
const cors = require('cors');

const app = express();
const PORT = 3002;

app.use(cors());
app.use(express.json());

/**
 * Endpoint to receive print jobs from the web ERP.
 */
app.post('/print', async (req, res) => {
    const { type, content, printerAddress, printerType } = req.body;

    console.log(`🖨️ Received ${type} print job...`);

    try {
        let device;
        if (printerType === 'NETWORK') {
            device = new escpos.Network(printerAddress);
        } else {
            device = new escpos.USB(); // Default to first USB printer
        }

        const printer = new escpos.Printer(device);

        device.open((error) => {
            if (error) {
                console.error('❌ Printer error:', error);
                return res.status(500).json({ error: error.message });
            }

            printer
                .font('a')
                .align('ct')
                .style('bu')
                .size(1, 1)
                .text(content)
                .cut()
                .close();

            res.json({ status: 'sent' });
        });
    } catch (error) {
        console.error('❌ Bridge error:', error);
        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 RestoFlow Print Bridge running on http://localhost:${PORT}`);
});
