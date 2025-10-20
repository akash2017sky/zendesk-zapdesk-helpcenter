# Zapdesk by KnowAll AI - Zendesk Lightning Tipping Widget

A React-based Bitcoin Lightning tipping widget for Zendesk Help Center that allows customers to tip support agents directly through the ticket interface.

## Features

- 🔐 Zendesk OAuth authentication
- 👤 Automatic agent info display from assigned ticket
- ⚡ Bitcoin Lightning Network integration
- 💰 Predefined tip amounts (100, 1000, 10,000 sats)
- 📱 QR code generation for Lightning payments
- 💬 Add optional message with tip
- 📝 Automatic comment creation in ticket history

## Prerequisites

- Node.js 18+ and npm
- Zendesk account with access to Help Center
- Bitcoin Lightning LNURL endpoint

## Installation

1. Install dependencies:
```bash
npm install
```

2. Configure your LNURL in `src/App.jsx`:
```javascript
const LNURL_BASE = 'YOUR_LNURL_HERE'
```

## Development

Run the development server:
```bash
npm run dev
```

The app will be available at `http://localhost:5173`

## Building for Production

Build the app:
```bash
npm run build
```

This creates optimized files in the `dist/` directory.

## Deployment to Zendesk

### Option 1: Host on External Server

1. Build the app: `npm run build`
2. Upload the contents of `dist/` to your web server
3. Note your hosted URL (e.g., `https://yourserver.com/zapdesk/`)

### Option 2: Zendesk App Framework

1. Create a Zendesk app using the Zendesk App Framework
2. Copy built files to the app's assets directory
3. Update the app manifest to include the iframe

### Adding to Zendesk Help Center

1. Go to Zendesk Admin Center
2. Navigate to Help Center → Customize Design
3. Edit your theme
4. Add an iframe to the request page template:

```html
<iframe
  src="https://yourserver.com/zapdesk/"
  width="100%"
  height="700px"
  frameborder="0"
  id="zapdesk-widget"
></iframe>
```

Or use Zendesk's widget system:

```html
<div id="zapdesk-container"></div>
<script>
  // Load widget
</script>
```

## Configuration

### Update LNURL

Edit `src/App.jsx` and update the `LNURL_BASE` constant:

```javascript
const LNURL_BASE = 'YOUR_ACTUAL_LNURL'
```

### Customize Tip Amounts

Modify the sat amounts in `src/App.jsx`:

```javascript
// Change these values
<button onClick={() => handleSatSelection(100)}>100 sats</button>
<button onClick={() => handleSatSelection(1000)}>1,000 sats</button>
<button onClick={() => handleSatSelection(10000)}>10,000 sats</button>
```

### Styling

Customize the appearance by editing `src/App.css`

## How It Works

1. Widget loads in Zendesk Help Center request page iframe
2. Zendesk ZAF SDK authenticates using OAuth client token
3. App fetches assigned agent details from current ticket
4. Customer selects tip amount (100, 1000, or 10000 sats)
5. QR code generates with LNURL + amount
6. Customer scans QR with Lightning wallet and pays
7. Customer clicks "Mark as Paid" to add confirmation comment
8. Comment appears in ticket discussion history

## API Integration

The app uses:
- **Zendesk ZAF SDK**: For authentication and ticket API access
- **React QR Code**: For generating Lightning payment QR codes
- **Zendesk REST API**: For posting comments to tickets

## Security Notes

- LNURL should be properly secured and validated
- All ticket comments are marked as internal/private by default
- OAuth tokens are handled by Zendesk's secure framework

## Troubleshooting

### Widget not loading in Zendesk
- Check if Zendesk ZAF SDK script is loaded
- Verify iframe source URL is correct and accessible
- Check browser console for CORS errors

### Agent info not displaying
- Ensure ticket has an assigned agent
- Verify Zendesk API permissions
- Check OAuth client token scopes

### QR code not generating
- Verify LNURL format is correct
- Check that react-qr-code package is installed
- Inspect browser console for errors

## License

MIT

## Support

For issues and questions, contact support@knowall.ai
