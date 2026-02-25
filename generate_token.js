const jwt = require('jsonwebtoken');
const secret = 'superSecretKeyForJwtAuthenticationThatNeedsToBeAtLeast64CharactersLongForHS512AlgorithmToWork123456789';
const base64Secret = Buffer.from(secret).toString('base64');
const token = jwt.sign(
  { roles: ['ROLE_ADMIN'], customerId: 1 },
  Buffer.from(secret, 'base64'),
  { subject: '1', expiresIn: '1h' }
);
console.log(token);
