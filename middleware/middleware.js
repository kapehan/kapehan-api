module.exports = async (app, request, reply) => {
  
  const authHeader = request.headers.authorization;
  console.log("request.url",request.url);
  if(request.url == "/v1/healthcheck"){
    return;
  }
  if (!authHeader?.startsWith('Bearer ')) {
    return reply.code(401).send({ success: false, expired: false, message: 'Missing or invalid token' });
  }
  const token = authHeader.split(' ')[1];
  console.log("token",token);
  try {
    app.jwt.verify(token); 
  } catch (err) {
    if (err.code === 'FAST_JWT_TOKEN_EXPIRED' || err.message?.includes('expired')) {

        return reply.code(401).send({ success: false, expired: true, message: 'Token Expired -- Refresh your token' });
    } else {
      return reply.code(401).send({ success: false, expired: false, message: 'Invalid token' });
    }
  }
}
