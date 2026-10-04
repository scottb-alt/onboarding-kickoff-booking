// Serverless proxy — forwards Slack webhook POSTs so the real URLs stay in env vars.
// SLACK_WEBHOOK_URL     → #onboarding-kickoff-requests (or similar)
// MIGRATIONS_WEBHOOK_URL → #migrations

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).end('Method Not Allowed');
  }

  const webhookUrl =
    req.query.type === 'migrations'
      ? process.env.MIGRATIONS_WEBHOOK_URL
      : process.env.SLACK_WEBHOOK_URL;

  if (!webhookUrl) {
    console.error('Webhook env var not set for type:', req.query.type);
    return res.status(500).json({ error: 'Webhook not configured' });
  }

  try {
    const body =
      typeof req.body === 'string' ? req.body : JSON.stringify(req.body);

    const slackRes = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
    });

    res.status(slackRes.ok ? 200 : slackRes.status).end();
  } catch (err) {
    console.error('Slack proxy error:', err);
    res.status(500).json({ error: err.message });
  }
};
