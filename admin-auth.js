const ADMIN_USER = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

function checkAdminPassword(password) {
  return password === ADMIN_PASSWORD;
}

module.exports = {
  ADMIN_USER,
  checkAdminPassword
};
