export default async function handler(req, res) {
  const clientId = process.env.WHOOP_CLIENT_ID;
  const clientSecret = process.env.WHOOP_CLIENT_SECRET;
  const redirectUri = process.env.REDIRECT_URI || `${process.env.VERCEL_URL ? 'https://' + process.env.VERCEL_URL : 'http://localhost:3000'}/api/whoop`;
  const appUrl = process.env.APP_URL || redirectUri.replace('/api/whoop', '/');

  const WHOOP_BASE = 'https://api.prod.whoop.com';
  const TOKEN_URL = `${WHOOP_BASE}/oauth/oauth2/token`;
  const API_V2 = `${WHOOP_BASE}/developer/v2`;

  // Helper: fetch from WHOOP API v2
  async function whoopFetch(path, token) {
    const url = `${API_V2}${path}`;
    const resp = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!resp.ok) {
      const text = await resp.text();
      throw new Error(`${resp.status}: ${text}`);
    }
    return resp.json();
  }

  // OAuth Callback - WHOOP redirects here with ?code= as GET
  if (req.method === 'GET' && req.query.code) {
    try {
      const { code } = req.query;

      const tokenResponse = await fetch(TOKEN_URL, {
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

      const tokenText = await tokenResponse.text();
      if (!tokenResponse.ok) {
        console.error('Token exchange failed:', tokenText);
        return res.redirect(`${appUrl}?auth_error=token_exchange_failed`);
      }

      const tokenData = JSON.parse(tokenText);
      const { access_token, refresh_token } = tokenData;

      return res.redirect(
        `${appUrl}?access_token=${encodeURIComponent(access_token)}` +
        (refresh_token ? `&refresh_token=${encodeURIComponent(refresh_token)}` : '')
      );
    } catch (error) {
      console.error('WHOOP auth error:', error);
      return res.redirect(`${appUrl}?auth_error=auth_failed`);
    }
  }

  // Return OAuth URL
  if (req.method === 'GET' && req.query.action === 'auth-url') {
    const { randomBytes } = await import('crypto');
    const state = randomBytes(16).toString('hex');
    return res.status(200).json({
      url: `${WHOOP_BASE}/oauth/oauth2/auth?` +
        `client_id=${clientId}` +
        `&response_type=code` +
        `&scope=offline read:recovery read:cycles read:sleep read:workout read:profile read:body_measurement` +
        `&redirect_uri=${encodeURIComponent(redirectUri)}` +
        `&state=${state}`
    });
  }

  // Refresh token endpoint
  if (req.method === 'POST' && req.body?.refresh_token) {
    try {
      const resp = await fetch(TOKEN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: req.body.refresh_token,
          client_id: clientId,
          client_secret: clientSecret
        }).toString()
      });
      if (!resp.ok) {
        throw new Error('Token refresh failed');
      }
      const data = await resp.json();
      return res.status(200).json({
        access_token: data.access_token,
        refresh_token: data.refresh_token
      });
    } catch (error) {
      console.error('Token refresh error:', error);
      return res.status(401).json({ error: 'Token refresh failed' });
    }
  }

  // Get WHOOP Data (v2 API)
  if (req.method === 'GET' && req.query.token) {
    try {
      const token = req.query.token;

      // Fetch cycle, recovery, and sleep in parallel
      const [cycleData, recoveryData, sleepData] = await Promise.all([
        whoopFetch('/cycle?limit=1', token),
        whoopFetch('/recovery?limit=1', token),
        whoopFetch('/activity/sleep?limit=1', token)
      ]);

      // Parse cycle — strain
      const cycle = cycleData.records?.[0];
      let strain = 0;
      if (cycle?.score_state === 'SCORED' && cycle?.score) {
        strain = cycle.score.strain || 0;
      }

      // Parse recovery
      const rec = recoveryData.records?.[0];
      let recovery = 0;
      let hrv = 0;
      let rhr = 0;
      if (rec?.score_state === 'SCORED' && rec?.score) {
        recovery = rec.score.recovery_score || 0;
        hrv = rec.score.hrv_rmssd_milli || 0;
        rhr = rec.score.resting_heart_rate || 0;
      }

      // Parse sleep
      const sleep = sleepData.records?.[0];
      let sleepHours = 0;
      if (sleep?.score_state === 'SCORED' && sleep?.score?.stage_summary) {
        const summary = sleep.score.stage_summary;
        const totalSleepMs = (summary.total_in_bed_time_milli || 0)
          - (summary.total_awake_time_milli || 0);
        sleepHours = totalSleepMs / 3600000;
      }

      return res.status(200).json({
        recovery,
        sleep: sleepHours,
        strain,
        steps: 0,
        hrv: Math.round(hrv),
        rhr
      });
    } catch (error) {
      if (error.message.startsWith('401')) {
        return res.status(401).json({ error: 'Token expired', needsRefresh: true });
      }
      console.error('WHOOP data fetch error:', error.message);
      return res.status(500).json({ error: 'Failed to fetch data', details: error.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
