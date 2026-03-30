export default async function handler(req, res) {
  const clientId = process.env.WHOOP_CLIENT_ID;
  const clientSecret = process.env.WHOOP_CLIENT_SECRET;
  const redirectUri = process.env.REDIRECT_URI || `${process.env.VERCEL_URL ? 'https://' + process.env.VERCEL_URL : 'http://localhost:3000'}/api/whoop`;
  const appUrl = process.env.APP_URL || redirectUri.replace('/api/whoop', '/workout_tracker_whoop.html');

  // OAuth Callback - WHOOP redirects here with ?code= as a GET
  if (req.method === 'GET' && req.query.code) {
    try {
      const { code } = req.query;

      // Exchange code for access token
      const tokenResponse = await fetch('https://api.prod.whoop.com/oauth/oauth2/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri
        }).toString()
      });

      if (!tokenResponse.ok) {
        const err = await tokenResponse.text();
        console.error('Token exchange failed:', err);
        return res.redirect(`${appUrl}?auth_error=token_exchange_failed`);
      }

      const { access_token, refresh_token } = await tokenResponse.json();

      // Redirect back to the app with the token in a fragment (not query param for security)
      return res.redirect(`${appUrl}?access_token=${encodeURIComponent(access_token)}&refresh_token=${encodeURIComponent(refresh_token)}`);
    } catch (error) {
      console.error('WHOOP auth error:', error);
      return res.redirect(`${appUrl}?auth_error=auth_failed`);
    }
  }

  // Return OAuth URL (so client ID stays server-side)
  if (req.method === 'GET' && req.query.action === 'auth-url') {
    return res.status(200).json({
      url: `https://api.prod.whoop.com/oauth/oauth2/auth?` +
        `client_id=${clientId}` +
        `&response_type=code` +
        `&scope=read:recovery read:sleep read:workout read:profile read:body_measurement` +
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
        sleep: cycle.sleep?.total_sleep_duration / 3600 || 0,
        strain: cycle.strain?.strain_score * 20 || 0,
        steps: cycle.activity?.steps || 0,
        hrv: cycle.heart_rate?.data?.hrv_ms || 0
      });
    } catch (error) {
      console.error('WHOOP data fetch error:', error);
      return res.status(500).json({ error: 'Failed to fetch data' });
    }
  }

  // POST handler for client-side token exchange (fallback)
  if (req.method === 'POST' && req.body?.code) {
    try {
      const { code } = req.body;

      const tokenResponse = await fetch('https://api.prod.whoop.com/oauth/oauth2/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri
        }).toString()
      });

      if (!tokenResponse.ok) {
        return res.status(400).json({ error: 'Token exchange failed' });
      }

      const { access_token, refresh_token } = await tokenResponse.json();
      return res.status(200).json({ accessToken: access_token, refreshToken: refresh_token });
    } catch (error) {
      console.error('WHOOP auth error:', error);
      return res.status(500).json({ error: 'Authentication failed' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
