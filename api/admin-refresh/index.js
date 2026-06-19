module.exports = async function (context, req) {
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
  const GITHUB_TOKEN = process.env.GITHUB_DISPATCH_TOKEN;
  const GITHUB_REPO = process.env.GITHUB_REPO || 'm77solutions/ccf-icorner';

  if (!ADMIN_PASSWORD || !GITHUB_TOKEN) {
    context.res = {
      status: 500,
      body: { error: 'Server misconfigured. Contact admin.' }
    };
    return;
  }

  const { password } = req.body || {};
  if (password !== ADMIN_PASSWORD) {
    context.res = {
      status: 401,
      body: { error: 'Invalid password.' }
    };
    return;
  }

  try {
    const response = await fetch(
      `https://api.github.com/repos/${GITHUB_REPO}/dispatches`,
      {
        method: 'POST',
        headers: {
          'Accept': 'application/vnd.github+json',
          'Authorization': `Bearer ${GITHUB_TOKEN}`,
          'X-GitHub-Api-Version': '2022-11-28',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          event_type: 'refresh-events',
          client_payload: {
            triggered_at: new Date().toISOString(),
            triggered_by: 'admin-refresh'
          }
        })
      }
    );

    if (response.status === 204) {
      context.res = {
        status: 200,
        body: {
          success: true,
          message: 'Refresh triggered. Kiosk will update in ~2-3 minutes.',
          timestamp: new Date().toISOString()
        }
      };
    } else {
      const errorText = await response.text();
      context.res = {
        status: 502,
        body: {
          error: `GitHub API error: ${response.status}`,
          details: errorText
        }
      };
    }
  } catch (err) {
    context.res = {
      status: 500,
      body: { error: 'Failed to trigger refresh.', details: err.message }
    };
  }
};
