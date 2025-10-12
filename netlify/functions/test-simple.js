export default async (req) => {
  return new Response(JSON.stringify({ 
    message: "Test function working",
    timestamp: new Date().toISOString()
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
};
