export default async function handler(req, res) {
  const clientId = process.env.WHOOP_CLIENT_ID;
  const clientSecret = process.env.WHOOP_CLIENT_SECRET;
  const redirectUri = `${process.env.VERCEL_URL ? 'https://' + process.env.VERCEL_URL : 'http://localhost:3000'}/api/whoop`;

  // OAuth Callback Handler
  if (req.method === 'POST' && req.body.code) {
    try {
      const { code } = req.body;

      // Exchange code for access token
      const tokenResponse = await fetch('https://accounts.whoop.com/oauth/oauth2/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grant_type: 'authorization_code',
          code,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri
        })
      });

      if (!tokenResponse.ok) {
        return res.status(400).json({ error: 'Token exchange failed' });
      }

      const { access_token, refresh_token } = await tokenResponse.json();

      // Store tokens securely (you should use a database in production)
      // For now, return to client for localStorage
      return res.status(200).json({
        accessToken: access_token,
        refreshToken: refresh_token
      });
    } catch (error) {
      console.error('WHOOP auth error:', error);
      return res.status(500).json({ error: 'Authentication failed' });
    }
  }

  // Return OAuth URL (so client ID stays server-side)
  if (req.method === 'GET' && req.query.action === 'auth-url') {
    return res.status(200).json({
      url: `https://accounts.whoop.com/oauth/oauth2/auth?` +
        `client_id=${clientId}` +
        `&response_type=code` +
        `&scope=read:cycles:heart_rate` +
        `&redirect_uri=${encodeURIComponent(redirectUri)}`
    });
  }

  // Get WHOOP Data
  if (req.method === 'GET' && req.query.token) {
    try {
      const token = req.query.token;

      // Fetch user data from WHOOP
      const userResponse = await fetch('https://api.prod.whoop.com/developer/v1/user', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!userResponse.ok) {
        return res.status(401).json({ error: 'Invalid token' });
      }

      const user = await userResponse.json();
      const userId = user.user_id;

      // Fetch latest cycle (today's data)
      const cyclesResponse = await fetch(
        `https://api.prod.whoop.com/developer/v1/cycle?user_id=${userId}&limit=1`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const cyclesData = await cyclesResponse.json();
      const cycle = cyclesData.cycles[0];

      return res.status(200).json({
        recovery: Math.round(cycle.recovery?.recovery_score * 100) || 0,
        sleep: cycle.sleep?.total_sleep_duration / 3600 || 0, // Convert seconds to hours
        strain: cycle.strain?.strain_score * 20 || 0, // Scale to 0-20
        steps: cycle.activity?.steps || 0,
        hrv: cycle.heart_rate?.data?.hrv_ms || 0
      });
    } catch (error) {
      console.error('WHOOP data fetch error:', error);
      return res.status(500).json({ error: 'Failed to fetch data' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
