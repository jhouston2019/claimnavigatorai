exports.handler = async (event) => {
  try {
    const body = JSON.parse(event.body || '{}');
    const situation = body.situation || 'unknown';
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: `AI Advisory received: ${situation}`,
        advisory: `Next steps for situation "${situation}" generated successfully.`,
      }),
    };
  } catch (error) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: error.message }),
    };
  }
};
