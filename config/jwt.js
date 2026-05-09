const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'votre-secret-jwt-tres-securise-2025';
const JWT_EXPIRES_IN = '7d'; // 7 jours

// Générer un token
const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
};

// Vérifier un token
const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
};

// Middleware pour vérifier le token
const authenticateToken = (req, res, next) => {
  const token = req.cookies?.token || req.headers['authorization']?.split(' ')[1];
  
  if (!token) {
    return res.redirect('/login');
  }
  
  const decoded = verifyToken(token);
  if (!decoded) {
    res.clearCookie('token');
    return res.redirect('/login');
  }
  
  req.user = decoded;
  next();
};

module.exports = { generateToken, verifyToken, authenticateToken, JWT_SECRET };