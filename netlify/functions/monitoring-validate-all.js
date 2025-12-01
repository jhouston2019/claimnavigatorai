exports.handler = async () => {
  const endpoints = [
    "errors-list",
    "errors-stats",
    "performance-metrics",
    "usage-list",
    "usage-stats",
    "cost-list",
    "rate-limit-list",
    "events-stream",
    "self-test",
    "service-health"
  ];

  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      success: true,
      endpoints: endpoints.map(e => `/.netlify/functions/monitoring-${e}`)
    })
  };
};


