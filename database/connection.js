const { Sequelize } = require('sequelize');
const path = require('path');

// Database configuration
const sequelize = process.env.NODE_ENV === 'production'
  ? new Sequelize(process.env.DATABASE_URL || 'postgresql://localhost:5432/aetheron', {
    dialect: 'postgres',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    }
  })
  : new Sequelize({
    dialect: 'sqlite',
    storage: path.join(__dirname, '..', 'data', 'aetheron.db'),
    logging: process.env.NODE_ENV === 'development' ? console.log : false
  });

module.exports = sequelize;
