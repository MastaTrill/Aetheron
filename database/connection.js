import { Sequelize } from 'sequelize';
import path from 'path';
import { fileURLToPath } from 'url';

const isProduction = process.env.NODE_ENV === 'production';

const sequelize = new Sequelize({
  dialect: isProduction ? 'postgres' : 'sqlite',
  ...(isProduction ? {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'aetheron',
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
    pool: {
      max: 20,
      min: 5,
      acquire: 30000,
      idle: 10000
    },
    logging: false
  } : {
    storage: path.join(
      path.dirname(fileURLToPath(import.meta.url)),
      '..',
      'data',
      'aetheron.db'
    ),
    logging: process.env.NODE_ENV === 'development' ? console.log : false
  })
});

export default sequelize;
