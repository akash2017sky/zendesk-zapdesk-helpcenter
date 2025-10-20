// Serverless function to fetch agent Lightning address from Zendesk
export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { agent_email } = req.query;

  if (!agent_email) {
    return res.status(400).json({ error: 'agent_email parameter required' });
  }

  // Zendesk credentials - you'll need to set these as environment variables
  const ZENDESK_SUBDOMAIN = process.env.ZENDESK_SUBDOMAIN || 'support.knowall.ai';
  const ZENDESK_EMAIL = process.env.ZENDESK_EMAIL; // Your Zendesk admin email
  const ZENDESK_API_TOKEN = process.env.ZENDESK_API_TOKEN; // Your API token

  if (!ZENDESK_EMAIL || !ZENDESK_API_TOKEN) {
    console.error('Zendesk credentials not configured');
    return res.status(500).json({
      error: 'Server configuration error',
      lightning_address: 'covertbrian73@walletofsatoshi.com' // Fallback
    });
  }

  try {
    // Search for user by email
    const searchUrl = `https://${ZENDESK_SUBDOMAIN}/api/v2/users/search.json?query=${encodeURIComponent(agent_email)}`;

    const auth = Buffer.from(`${ZENDESK_EMAIL}/token:${ZENDESK_API_TOKEN}`).toString('base64');

    const response = await fetch(searchUrl, {
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Zendesk API returned ${response.status}`);
    }

    const data = await response.json();

    if (data.users && data.users.length > 0) {
      const user = data.users[0];

      // Get lightning address from user fields
      const lightningAddress = user.user_fields?.lightning_address || 'covertbrian73@walletofsatoshi.com';

      return res.status(200).json({
        success: true,
        agent_name: user.name,
        agent_email: user.email,
        lightning_address: lightningAddress,
        avatar_url: user.photo?.content_url || null
      });
    } else {
      return res.status(404).json({
        error: 'Agent not found',
        lightning_address: 'covertbrian73@walletofsatoshi.com' // Fallback
      });
    }
  } catch (error) {
    console.error('Error fetching agent data:', error);
    return res.status(500).json({
      error: error.message,
      lightning_address: 'covertbrian73@walletofsatoshi.com' // Fallback
    });
  }
}
