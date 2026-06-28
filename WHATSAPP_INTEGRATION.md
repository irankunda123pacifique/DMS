# WhatsApp Integration Guide for DMS

This guide explains how to integrate WhatsApp messaging into the Discipline Management System to automatically notify parents about student discipline mark changes.

## Overview

The DMS now supports two methods for sending WhatsApp messages to parents:

1. **Official WhatsApp Business API** - More reliable for production
2. **WhatsApp Web (whatsapp-web.js)** - No API credentials needed, browser-based

## Features

✅ Automatic notifications when discipline marks are removed  
✅ Customizable message templates  
✅ Parent phone number formatting (international format)  
✅ Bulk message sending support  
✅ Failed message logging  
✅ Easy fallback handling  

## Prerequisites

### Core Requirements
- Node.js 14+ installed
- NPM or Yarn package manager
- Active WhatsApp account (personal or business)
- Parent phone numbers stored in database (already integrated)

### Installation

```bash
# Install required dependencies
cd server
npm install

# Optional: Install WhatsApp Web dependencies (for WhatsApp Web method)
npm install whatsapp-web.js qrcode-terminal
```

## Method 1: Official WhatsApp Business API (Recommended for Production)

### Setup Steps

#### 1. Create Meta Business Account
1. Go to [Meta for Developers](https://developers.facebook.com/)
2. Create a new business account
3. Create a new app (select "Business" type)

#### 2. Get WhatsApp Business API Credentials
1. In your app, go to **WhatsApp > Getting Started**
2. Follow the setup wizard to create a business account
3. Register your phone number
4. Wait for approval (usually 5-10 minutes)

#### 3. Get Your Credentials
1. Go to **WhatsApp > API Setup**
2. Copy these values:
   - **Phone Number ID**: Found under "Phone numbers" section
   - **Access Token**: Found under "Temporary access token" or **Settings > User access tokens**

#### 4. Configure Environment Variables

Update your `.env` file:

```env
WHATSAPP_ENABLED=true
WHATSAPP_SCHOOL_NAME=Your School Name
WHATSAPP_API_URL=https://graph.instagram.com/v18.0
WHATSAPP_PHONE_NUMBER_ID=your-phone-number-id-here
WHATSAPP_ACCESS_TOKEN=your-access-token-here
```

#### 5. Get Permanent Access Token (Production)

1. Go to Meta App Dashboard
2. Navigate to **Settings > User access tokens**
3. Generate a permanent token
4. Replace the temporary token in `.env`

### Testing the Official API

```bash
# Test with cURL
curl -X POST http://localhost:5000/api/discipline/whatsapp/test \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "+250781234567",
    "message": "Test message from DMS"
  }'
```

### Message Format

Messages are automatically formatted with:
- Student name and class
- Number of marks removed
- Reason for removal
- New discipline score
- School name
- Professional footer

**Example Message:**
```
Dear Parent,

This is a notification from *Greenfield Academy*.

Your student *Alice Mutesi* (Class: S4A) has had *5 discipline mark(s)* removed.

*Reason:* Improved behavior

*New Discipline Score:* 90 marks

Please contact the school if you have any questions.

Best regards,
Discipline Management System
Greenfield Academy
```

## Method 2: WhatsApp Web (whatsapp-web.js)

This method uses browser automation to send messages directly from WhatsApp Web. No API credentials needed!

### Setup Steps

#### 1. Install Optional Dependencies

```bash
npm install whatsapp-web.js qrcode-terminal
```

#### 2. Configure Environment

Update `.env`:

```env
WHATSAPP_ENABLED=true
WHATSAPP_SCHOOL_NAME=Your School Name
# Don't set WHATSAPP_PHONE_NUMBER_ID or WHATSAPP_ACCESS_TOKEN
# The service will use WhatsApp Web automatically
```

#### 3. Initialize WhatsApp Web

Send a POST request to initialize the connection:

```bash
curl -X POST http://localhost:5000/api/discipline/whatsapp/init
```

This will:
1. Start the WhatsApp Web client
2. Display a QR code in the server console
3. Wait for you to scan the QR code with your WhatsApp phone

#### 4. Scan QR Code

1. Check your server logs (you'll see the QR code displayed)
2. Open WhatsApp on your phone
3. Go to **Settings > Linked Devices**
4. Tap **Link a Device**
5. Point your phone camera at the displayed QR code
6. Confirm on your phone

#### 5. Verify Connection

Once authenticated, you should see in the logs:
```
✓ WhatsApp authenticated successfully!
✓ WhatsApp Web client is ready!
```

### Advantages & Disadvantages

**Advantages:**
- No API credentials needed
- Works with personal WhatsApp accounts
- Quick to set up
- Free (no API charges)

**Disadvantages:**
- Requires phone scan each time
- Less reliable than official API (subject to WhatsApp Web changes)
- May face rate limiting
- Requires running WhatsApp client continuously

## How It Works

### Automatic Parent Notification Flow

When a discipline request is **approved** in the DOD dashboard:

```
Discipline Request Approved
    ↓
Mark Removal Calculation
    ↓
Student Record Updated
    ↓
Parent Phone Retrieved
    ↓
WhatsApp Message Formatted
    ↓
Message Sent via Configured Method
    ↓
Notification Logged
```

### API Endpoints

#### 1. Approve Discipline Request with Notification

**Endpoint:** `PATCH /api/discipline/:requestId/review`

**Request Body:**
```json
{
  "status": "approved",
  "notes": "Student has shown improvement"
}
```

**Response:**
```json
{
  "id": 1,
  "status": "approved",
  "message": "Discipline request reviewed successfully",
  "whatsappNotification": "Sent to parent",
  "marks_removed": 5,
  "discipline_marks": 90
}
```

#### 2. Send Test Message

**Endpoint:** `POST /api/discipline/whatsapp/test`

**Request Body:**
```json
{
  "phoneNumber": "+250781234567",
  "message": "Custom test message"
}
```

**Response:**
```json
{
  "success": true,
  "phone": "250781234567",
  "method": "Official API" or "WhatsApp Web",
  "messageId": "message_id"
}
```

#### 3. Initialize WhatsApp Web

**Endpoint:** `POST /api/discipline/whatsapp/init`

**Response:**
```json
{
  "message": "WhatsApp Web initialization started",
  "note": "Check server logs for QR code"
}
```

## Phone Number Formatting

The service automatically handles various phone number formats:

```javascript
// Input formats accepted:
+250781234567       // E164 format
250781234567        // Without +
0781234567          // Local format
781234567           // Without country code

// All converted to: 250781234567 (E164 without +)
```

## Error Handling

### Common Errors & Solutions

**Error: "No parent phone number"**
- Solution: Ensure parent phone is added when creating/editing student

**Error: "WhatsApp Web client not initialized"**
- Solution: Run `POST /api/discipline/whatsapp/init` first
- Scan QR code with your phone
- Wait for "ready" message

**Error: "Invalid credentials"**
- Solution: Check `WHATSAPP_ACCESS_TOKEN` is valid
- Generate new token from Meta dashboard if expired

**Error: "Rate limited"**
- Solution: Wait before sending more messages
- Official API: Max 60 messages/minute per number
- WhatsApp Web: May face limits if sending too many

## Database

Parent phone numbers are stored in the `students` table:

```sql
CREATE TABLE students (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ...
    parent_phone VARCHAR(20),
    ...
);
```

Sample data:
```sql
INSERT INTO students (school_id, full_name, parent_phone, ...)
VALUES (1, 'Alice Mutesi', '+250781111001', ...);
```

## Configuration Examples

### Example 1: Development with WhatsApp Web

```env
WHATSAPP_ENABLED=true
WHATSAPP_SCHOOL_NAME=Test School
# Leave WHATSAPP_PHONE_NUMBER_ID and WHATSAPP_ACCESS_TOKEN empty
```

### Example 2: Production with Official API

```env
WHATSAPP_ENABLED=true
WHATSAPP_SCHOOL_NAME=Greenfield Academy
WHATSAPP_API_URL=https://graph.instagram.com/v18.0
WHATSAPP_PHONE_NUMBER_ID=1234567890123456
WHATSAPP_ACCESS_TOKEN=EAABsbCS1iHgBABZCqWO...
```

### Example 3: Disabled (Manual Sending)

```env
WHATSAPP_ENABLED=false
WHATSAPP_SCHOOL_NAME=School Name
```

When disabled, the system still prepares messages but doesn't send them automatically.

## Testing

### Unit Test: Send Message

```javascript
const whatsappService = require('./services/whatsapp');

// Test 1: Send test message
const result = await whatsappService.sendMessage(
    '+250781234567',
    'Test message'
);
console.log(result);

// Test 2: Notify parent of mark removal
const studentData = {
    full_name: 'Alice Mutesi',
    class: 'S4A',
    parent_name: 'Mrs. Mutesi Grace',
    parent_phone: '+250781111001',
    discipline_marks: 90
};

const result = await whatsappService.notifyParentOfMarkRemoval(
    studentData,
    5,
    'Good behavior shown'
);
console.log(result);
```

### Integration Test: Full Workflow

```bash
# 1. Start server
npm run dev

# 2. Initialize WhatsApp Web (if using that method)
curl -X POST http://localhost:5000/api/discipline/whatsapp/init

# 3. Create a discipline request
curl -X POST http://localhost:5000/api/discipline \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "school_id": 1,
    "student_id": 1,
    "mistake": "Late assignment",
    "marks_removed": 5,
    "target_type": "student"
  }'

# 4. Approve the request (sends WhatsApp to parent)
curl -X PATCH http://localhost:5000/api/discipline/1/review \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "approved",
    "notes": "Assignment submitted"
  }'
```

## Logging

WhatsApp messages are logged in:
- **Console**: Real-time activity during development
- **Winston logs**: Production logging (if configured)
- **Database**: Activity can be tracked via audit logs

Check logs for:
```
✓ WhatsApp message sent to [phone]
❌ Failed to send WhatsApp message: [reason]
⚠️ WhatsApp messaging is disabled
```

## Production Deployment

### Recommendations

1. **Use Official WhatsApp Business API**
   - More stable and supported
   - Dedicated support from Meta
   - Better for scaling

2. **Environment Variables**
   - Never hardcode credentials
   - Use secure secret management
   - Rotate tokens periodically

3. **Monitoring**
   - Track message delivery rates
   - Log failures for debugging
   - Set up alerts for errors

4. **Rate Limiting**
   - Implement queue system for bulk messages
   - Add delays between messages
   - Handle rate limit errors gracefully

## Troubleshooting

### Debug Mode

Enable detailed logging:

```env
LOG_LEVEL=debug
```

### Test Connectivity

```bash
# Test Official API connectivity
curl -X GET "https://graph.instagram.com/v18.0/me?access_token=YOUR_TOKEN"

# Test WhatsApp Web
npm install debug
DEBUG=whatsapp* npm run dev
```

### Common Issues

**Issue: Messages not sending**
- Check WhatsApp number is verified and registered
- Verify access token is not expired
- Check phone number format is correct
- Check WHATSAPP_ENABLED is true

**Issue: QR code not displaying**
- Check `qrcode-terminal` is installed
- Check console output for errors
- Increase console verbosity with DEBUG

**Issue: Slow message delivery**
- Check internet connection
- Check server resources
- Consider implementing message queue
- Use bulk API endpoint for multiple messages

## Support

For issues related to:
- **WhatsApp Business API**: Contact Meta support
- **whatsapp-web.js**: Check [GitHub issues](https://github.com/pedroslopez/whatsapp-web.js/issues)
- **DMS Integration**: Check DMS documentation

## API Rate Limits

**Official WhatsApp API:**
- 60 messages/minute per phone number
- 1000 messages/day per phone number

**WhatsApp Web:**
- Subject to WhatsApp's terms of service
- May face temporary blocks if sending too fast
- Recommended: 1 message/second max

## Security Considerations

✅ Never expose access tokens in code  
✅ Use environment variables for credentials  
✅ Validate phone numbers before sending  
✅ Log message sending for audit  
✅ Implement rate limiting to prevent abuse  
✅ Use HTTPS for all API communications  

## Next Steps

1. Choose your WhatsApp method (Official API or WhatsApp Web)
2. Complete setup steps above
3. Test with sample messages
4. Deploy to production
5. Monitor message delivery
6. Gather parent feedback

---

**Questions?** See [README.md](README.md) or [API.md](API.md)

**Version:** 1.0.0  
**Last Updated:** May 28, 2026
