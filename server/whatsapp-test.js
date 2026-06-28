#!/usr/bin/env node

/**
 * DMS WhatsApp Testing & Initialization Script
 * 
 * Usage:
 *   npm run whatsapp-init      # Initialize WhatsApp Web
 *   npm run whatsapp-test      # Send test message
 *   npm run whatsapp-status    # Check WhatsApp status
 */

require('dotenv').config();
const readline = require('readline');
const whatsappService = require('./services/whatsapp');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const question = (prompt) => new Promise((resolve) => {
    rl.question(prompt, resolve);
});

async function main() {
    console.log('\n🤖 DMS WhatsApp Service Tool\n');

    const command = process.argv[2];

    if (command === 'init') {
        await initWhatsApp();
    } else if (command === 'test') {
        await testMessage();
    } else if (command === 'status') {
        await checkStatus();
    } else {
        showHelp();
    }

    rl.close();
}

async function initWhatsApp() {
    console.log('📱 Initializing WhatsApp Web...\n');
    
    if (!process.env.WHATSAPP_ENABLED) {
        console.error('❌ WhatsApp is not enabled in .env file');
        console.log('   Set: WHATSAPP_ENABLED=true');
        return;
    }

    try {
        await whatsappService.initializeWhatsAppWeb();
        console.log('\n✓ Initialization started!');
        console.log('📱 Scan the QR code displayed above with your WhatsApp phone.');
        console.log('⏳ Waiting for authentication...\n');
        
        // Keep the process alive
        await new Promise(() => {});
    } catch (error) {
        console.error('❌ Initialization failed:', error.message);
    }
}

async function testMessage() {
    console.log('📨 Send Test WhatsApp Message\n');

    const phoneNumber = await question('📱 Enter phone number (e.g., +250781234567): ');
    const message = await question('✍️  Enter message: ');

    if (!phoneNumber || !message) {
        console.error('❌ Phone number and message are required');
        return;
    }

    try {
        console.log('\n⏳ Sending message...\n');
        const result = await whatsappService.sendMessage(phoneNumber, message);

        if (result.success) {
            console.log('✓ Message sent successfully!');
            console.log(`  Phone: ${result.phone}`);
            console.log(`  Method: ${result.method || 'Unknown'}`);
            if (result.messageId) {
                console.log(`  Message ID: ${result.messageId}`);
            }
        } else {
            console.log('⚠️  Message sending failed:');
            console.log(`  Error: ${result.message}`);
            if (result.fallback) {
                console.log('  Fallback information:');
                console.log(`  Phone: ${result.phoneNumber}`);
                console.log(`  Preview: ${result.messagePreview}`);
            }
        }
    } catch (error) {
        console.error('❌ Error:', error.message);
    }

    console.log();
}

async function checkStatus() {
    console.log('🔍 WhatsApp Service Status\n');

    console.log(`📌 Configuration:`);
    console.log(`  Enabled: ${process.env.WHATSAPP_ENABLED === 'true' ? '✓ Yes' : '✗ No'}`);
    console.log(`  School Name: ${process.env.WHATSAPP_SCHOOL_NAME || 'Not set'}`);
    
    if (process.env.WHATSAPP_PHONE_NUMBER_ID) {
        console.log(`  API Type: Official WhatsApp Business API`);
        console.log(`  Phone Number ID: ${process.env.WHATSAPP_PHONE_NUMBER_ID.substring(0, 10)}...`);
        console.log(`  Access Token: ${process.env.WHATSAPP_ACCESS_TOKEN ? 'Set' : 'Not set'}`);
    } else {
        console.log(`  API Type: WhatsApp Web (whatsapp-web.js)`);
        console.log(`  Client Status: ${global.whatsappClient ? 'Connected' : 'Not connected'}`);
    }

    console.log(`\n✓ Status check completed\n`);
}

function showHelp() {
    console.log(`Usage: node whatsapp-test.js <command>

Commands:
  init      Initialize WhatsApp Web connection (requires QR scan)
  test      Send a test message
  status    Check WhatsApp service status
  help      Show this help message

Examples:
  node whatsapp-test.js init
  node whatsapp-test.js test
  node whatsapp-test.js status

Environment Variables (.env):
  WHATSAPP_ENABLED=true|false             Enable/disable WhatsApp
  WHATSAPP_SCHOOL_NAME=Your School        School name in messages
  
  For Official API:
  WHATSAPP_PHONE_NUMBER_ID=...            WhatsApp Phone Number ID
  WHATSAPP_ACCESS_TOKEN=...               Meta access token

For more information, see WHATSAPP_INTEGRATION.md
    `);
}

main().catch(console.error);
