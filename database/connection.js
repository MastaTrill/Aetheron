import { Sequelize } from 'sequelize';
import path from 'path';
import { fileURLToPath } from 'url';

// Database configuration
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(
    path.dirname(fileURLToPath(import.meta.url)),
    '..',
    'data',
    'aetheron.db'
  ),
  logging: process.env.NODE_ENV === 'development' ? console.log : false
});

export default sequelize;
