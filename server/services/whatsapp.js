let Client, LocalAuth;
let client = null;
let isReady = false;
let pairingCode = null;
let status = 'disconnected';

function init() {
    if (client) return;
    if (!Client) ({ Client, LocalAuth } = require('whatsapp-web.js'));
    status = 'connecting';

    client = new Client({
        authStrategy: new LocalAuth({ clientId: 'dms' }),
        puppeteer: { args: ['--no-sandbox', '--disable-setuid-sandbox'] }
    });

    client.on('ready', () => {
        isReady = true;
        status = 'ready';
        pairingCode = null;
        console.log('✅ WhatsApp ready!');
    });

    client.on('authenticated', () => {
        status = 'authenticated';
        pairingCode = null;
    });

    client.on('disconnected', () => {
        isReady = false;
        status = 'disconnected';
        pairingCode = null;
        client = null;
    });

    client.initialize();
}

async function requestPairingCode(phoneNumber) {
    if (!client) init();

    // Wait for client to be ready for pairing (not yet authenticated)
    await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Timeout waiting for client')), 20000);
        const check = setInterval(() => {
            if (status === 'connecting' || status === 'disconnected') return;
            if (client) { clearInterval(check); clearTimeout(timeout); resolve(); }
        }, 500);
        // Also resolve immediately if client exists
        if (client) { clearInterval(check); clearTimeout(timeout); resolve(); }
    });

    try {
        const cleaned = phoneNumber.replace(/\D/g, '');
        pairingCode = await client.requestPairingCode(cleaned);
        status = 'pairing';
        console.log(`📱 Pairing code for ${cleaned}: ${pairingCode}`);
        return pairingCode;
    } catch (err) {
        console.error('Pairing error:', err.message);
        throw err;
    }
}

function getStatus() {
    return { status, isReady, pairingCode };
}

function disconnect() {
    if (client) { client.destroy(); client = null; }
    isReady = false;
    status = 'disconnected';
    pairingCode = null;
}

async function sendMessage(phone, message) {
    if (!isReady || !client) {
        console.log('WhatsApp send failed: Not connected.');
        return { success: false, message: 'WhatsApp not connected' };
    }
    try {
        let cleaned = phone.replace(/\D/g, '');
        // Auto-format local Rwandan numbers (e.g. 078... -> 25078...)
        if (cleaned.startsWith('0') && cleaned.length === 10) {
            cleaned = '250' + cleaned.substring(1);
        }
        console.log(`Sending WhatsApp message to ${cleaned}@c.us...`);
        await client.sendMessage(cleaned + '@c.us', message);
        console.log('WhatsApp message sent successfully.');
        return { success: true };
    } catch (err) {
        console.error('WhatsApp send error:', err.message);
        return { success: false, message: err.message };
    }
}

async function notifyParent(student, marksRemoved, reason, schoolName = process.env.WHATSAPP_SCHOOL_NAME || 'Kageyo TSS') {
    if (!student.parent_phone) return { success: false, message: 'No parent phone' };
    const message =
`Dear ${student.parent_name || 'Parent'},

This is a notification from *${schoolName}*.

Your child *${student.full_name}* (Class ${student.class}) received a discipline deduction.

*Reason:* ${reason}
*Marks Removed:* -${marksRemoved}
*Current Score:* ${student.discipline_marks}/100

Contact the school for more information.

— Discipline Management System`;

    return await sendMessage(student.parent_phone, message);
}

module.exports = { init, requestPairingCode, getStatus, disconnect, sendMessage, notifyParent };
