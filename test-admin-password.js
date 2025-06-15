// JavaScript code goes here
console.log("Hello, world!");
import { getAdminPassword } from './admin-auth.js';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question("Enter admin password: ", (abc123AetheronisM3) => {
  const adminPassword = getAdminPassword();
  if (abc123AetheronisM3 === adminPassword) {
    console.log("Access granted.");
  } else {
    console.log("Access denied.");
  }
  rl.close();
});