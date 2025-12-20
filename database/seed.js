const bcrypt = require('bcryptjs');
const { User, Log } = require('./models');

async function seed() {
  try {
    console.log('🌱 Seeding database...');

    // Create admin user
    const adminPassword = await bcrypt.hash('admin123', 10);
    const admin = await User.findOrCreate({
      where: { username: 'admin' },
      defaults: {
        address: '0xabcd1234567890abcd1234567890abcd12345678',
        email: 'admin@aetheron.io',
        username: 'admin',
        passwordHash: adminPassword,
        balance: 10000,
        role: 'admin',
        kycStatus: 'verified',
        isActive: true
      }
    });

    // Create demo user
    const userPassword = await bcrypt.hash('user123', 10);
    const user = await User.findOrCreate({
      where: { username: 'demo' },
      defaults: {
        address: '0x1234567890abcdef1234567890abcdef12345678',
        email: 'demo@aetheron.io',
        username: 'demo',
        passwordHash: userPassword,
        balance: 1000,
        role: 'user',
        kycStatus: 'verified',
        isActive: true
      }
    });

    // Create initial logs
    await Log.bulkCreate([
      {
        type: 'SUCCESS',
        details: { message: 'Database seeded successfully' },
        userId: admin[0].id
      },
      {
        type: 'INFO',
        details: { message: 'Admin user created', username: 'admin' }
      },
      {
        type: 'INFO',
        details: { message: 'Demo user created', username: 'demo' }
      }
    ]);

    console.log('✅ Admin user created: admin / admin123');
    console.log('✅ Demo user created: demo / user123');
    console.log('🎉 Database seeding completed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

seed();
