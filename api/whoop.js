export default async function handler(req, res) {
  const clientId = process.env.WHOOP_CLIENT_ID;
  const clientSecret = process.env.WHOOP_CLIENT_SECRET;
  const redirectUri = process.env.REDIRECT_URI || `${process.env.VERCEL_URL ? 'https://' + process.env.VERCEL_URL : 'http://localhost:3000'}/api/whoop`;
  const appUrl = process.env.APP_URL || redirectUri.replace('/api/whoop', '/workout_tracker_whoop.html');

  const WHOOP_BASE = 'https://api.prod.whoop.com';
  const TOKEN_URL = `${WHOOP_BASE}/oauth/oauth2/token`;

  // Helper: fetch from WHOOP API with auth
  async function whoopFetch(path, token) {
    const url = `${WHOOP_BASE}/developer${path}`;
    console.log(`Fetching: ${url}`);
    const resp = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!resp.ok) {
      const text = await resp.text();
      console.error(`WHOOP API ${path} returned ${resp.status}: ${text}`);
      throw new Error(`${resp.status}: ${text}`);
    }
    return resp.json();
  }

  // Helper: refresh access token
  async function refreshToken(refresh_token) {
    const resp = await fetch(TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token,
        client_id: clientId,
        client_secret: clientSecret
      }).toString()
    });
    if (!resp.ok) {
      throw new Error('Token refresh failed');
    }
    return resp.json();
  }

  // OAuth Callback - WHOOP redirects here with ?code= as GET
  if (req.method === 'GET' && req.query.code) {
    try {
      const { code } = req.query;

      console.log('Exchanging code for token at:', TOKEN_URL);
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
      console.log('Token response status:', tokenResponse.status);
      console.log('Token response body:', tokenText.substring(0, 200));

      if (!tokenResponse.ok) {
        return res.redirect(`${appUrl}?auth_error=token_exchange_failed`);
      }

      const tokenData = JSON.parse(tokenText);
      const { access_token, refresh_token } = tokenData;

      // Debug: test the token immediately
      const testResp = await fetch(`${WHOOP_BASE}/developer/v1/cycle?limit=1`, {
        headers: { Authorization: `Bearer ${access_token}` }
      });
      const testStatus = testResp.status;
      const testBody = await testResp.text();
      console.log('Token test - status:', testStatus, 'body:', testBody.substring(0, 300));

      // If token doesn't work, show debug info instead of silently failing
      if (testStatus !== 200) {
        return res.status(200).send(`
          <html><body style="background:#000;color:#fff;font-family:monospace;padding:20px;">
            <h2>WHOOP Debug</h2>
            <p>Token exchange: SUCCESS</p>
            <p>Token test against /v1/cycle: ${testStatus}</p>
            <p>Response: ${testBody.substring(0, 500)}</p>
            <p>Token (first 20 chars): ${access_token?.substring(0, 20)}...</p>
            <p>Token fields returned: ${Object.keys(tokenData).join(', ')}</p>
            <br><a href="${appUrl}" style="color:yellow;">Go back to app</a>
          </body></html>
        `);
      }

      return res.redirect(
        `${appUrl}?access_token=${encodeURIComponent(access_token)}` +
        `&refresh_token=${encodeURIComponent(refresh_token)}`
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
        `&scope=read:recovery read:sleep read:workout read:profile read:body_measurement` +
        `&redirect_uri=${encodeURIComponent(redirectUri)}` +
        `&state=${state}`
    });
  }

  // Refresh token endpoint
  if (req.method === 'POST' && req.body?.refresh_token) {
    try {
      const tokenData = await refreshToken(req.body.refresh_token);
      return res.status(200).json({
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token
      });
    } catch (error) {
      console.error('Token refresh error:', error);
      return res.status(401).json({ error: 'Token refresh failed' });
    }
  }

  // Get WHOOP Data
  if (req.method === 'GET' && req.query.token) {
    try {
      const token = req.query.token;

      // First try to fetch cycle - if 401, token is expired
      let cycleData;
      try {
        cycleData = await whoopFetch('/v1/cycle?limit=1', token);
      } catch (e) {
        if (e.message.startsWith('401')) {
          return res.status(401).json({ error: 'Token expired', needsRefresh: true });
        }
        throw e;
      }

      // Fetch sleep in parallel
      let sleepData;
      try {
        sleepData = await whoopFetch('/v1/activity/sleep?limit=1', token);
      } catch (e) {
        console.error('Sleep fetch failed:', e.message);
        sleepData = { records: [] };
      }

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
          console.log('No recovery for cycle:', e.message);
        }
      }

      // Parse sleep
      let sleepHours = 0;
      const sleep = sleepData.records?.[0];
      if (sleep?.score_state === 'SCORED' && sleep?.score?.stage_summary) {
        const totalSleepMs = sleep.score.stage_summary.total_in_bed_time_milli
          - sleep.score.stage_summary.total_awake_time_milli;
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
      console.error('WHOOP data fetch error:', error.message);
      return res.status(500).json({ error: 'Failed to fetch data', details: error.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
