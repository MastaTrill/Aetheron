const { sequelize } = require('./models');

async function migrate() {
  try {
    console.log('🔄 Running database migrations...');

    // Test connection
    await sequelize.authenticate();
    console.log('✅ Database connection established');

    // Sync all models
    await sequelize.sync({ alter: true });
    console.log('✅ Database schema synchronized');

    console.log('🎉 Migrations completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrate();
