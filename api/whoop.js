export default async function handler(req, res) {
  const clientId = process.env.WHOOP_CLIENT_ID;
  const clientSecret = process.env.WHOOP_CLIENT_SECRET;
  const redirectUri = process.env.REDIRECT_URI || `${process.env.VERCEL_URL ? 'https://' + process.env.VERCEL_URL : 'http://localhost:3000'}/api/whoop`;
  const appUrl = process.env.APP_URL || redirectUri.replace('/api/whoop', '/workout_tracker_whoop.html');

  const WHOOP_API = 'https://api.prod.whoop.com/developer';

  // Helper: fetch from WHOOP API with auth
  async function whoopFetch(path, token) {
    const resp = await fetch(`${WHOOP_API}${path}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!resp.ok) {
      const text = await resp.text();
      throw new Error(`WHOOP API ${path} returned ${resp.status}: ${text}`);
    }
    return resp.json();
  }

  // OAuth Callback - WHOOP redirects here with ?code= as a GET
  if (req.method === 'GET' && req.query.code) {
    try {
      const { code } = req.query;

      const tokenResponse = await fetch(`${WHOOP_API}/../oauth/oauth2/token`, {
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
      return res.redirect(`${appUrl}?access_token=${encodeURIComponent(access_token)}&refresh_token=${encodeURIComponent(refresh_token)}`);
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
      url: `https://api.prod.whoop.com/oauth/oauth2/auth?` +
        `client_id=${clientId}` +
        `&response_type=code` +
        `&scope=read:recovery read:sleep read:workout read:profile read:body_measurement` +
        `&redirect_uri=${encodeURIComponent(redirectUri)}` +
        `&state=${state}`
    });
  }

  // Get WHOOP Data - fetch from multiple endpoints
  if (req.method === 'GET' && req.query.token) {
    try {
      const token = req.query.token;

      // Fetch latest cycle, recovery, and sleep in parallel
      const [cycleData, sleepData] = await Promise.all([
        whoopFetch('/v1/cycle?limit=1', token),
        whoopFetch('/v1/activity/sleep?limit=1', token)
      ]);

      // Parse cycle
      const cycle = cycleData.records?.[0];
      let strain = 0;
      if (cycle?.score_state === 'SCORED' && cycle?.score) {
        strain = cycle.score.strain || 0;
      }

      // Fetch recovery for this cycle
      let recovery = 0;
      let hrv = 0;
      let rhr = 0;
      if (cycle?.id) {
        try {
          const recoveryData = await whoopFetch(`/v1/cycle/${cycle.id}/recovery`, token);
          if (recoveryData.score_state === 'SCORED' && recoveryData.score) {
            recovery = recoveryData.score.recovery_score || 0;
            hrv = recoveryData.score.hrv_rmssd_milli || 0;
            rhr = recoveryData.score.resting_heart_rate || 0;
          }
        } catch (e) {
          // 404 = no recovery for this cycle, that's OK
          console.log('No recovery for cycle:', e.message);
        }
      }

      // Parse sleep
      let sleepHours = 0;
      const sleep = sleepData.records?.[0];
      if (sleep?.score_state === 'SCORED' && sleep?.score?.stage_summary) {
        const totalSleepMs = sleep.score.stage_summary.total_in_bed_time_milli
          - sleep.score.stage_summary.total_awake_time_milli;
        sleepHours = totalSleepMs / 3600000; // ms to hours
      }

      return res.status(200).json({
        recovery,
        sleep: sleepHours,
        strain,
        steps: 0, // Steps not available in WHOOP API v1
        hrv: Math.round(hrv),
        rhr,
        cycleId: cycle?.id || null,
        debug: {
          cycleScoreState: cycle?.score_state,
          sleepScoreState: sleep?.score_state,
          hasCycle: !!cycle,
          hasSleep: !!sleep
        }
      });
    } catch (error) {
      console.error('WHOOP data fetch error:', error.message);
      return res.status(500).json({ error: 'Failed to fetch data', details: error.message });
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
