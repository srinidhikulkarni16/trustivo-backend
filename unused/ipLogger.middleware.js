export const captureIP = (req, res, next) => {
  const forwarded = req.headers["x-forwarded-for"];
  req.clientIP = forwarded ? forwarded.split(",")[0].trim() : req.socket.remoteAddress;
  next();
};