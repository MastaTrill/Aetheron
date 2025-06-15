const bcrypt = require('bcryptjs');
const fs = require('fs');
const ADMIN_USER = 'MastaTrill';
const PASS_FILE = 'admin_pass.hash';

function setAdminPassword(plainPassword) {
  const hash = bcrypt.hashSync(plainPassword, 10);
  fs.writeFileSync(PASS_FILE, hash);
}

function checkAdminPassword(plainPassword) {
  if (!fs.existsSync(PASS_FILE)) return false;
  const hash = fs.readFileSync(PASS_FILE, 'utf8');
  return bcrypt.compareSync(plainPassword, hash);
}

module.exports = { ADMIN_USER, setAdminPassword, checkAdminPassword };
