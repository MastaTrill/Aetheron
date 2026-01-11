import { DataTypes } from 'sequelize';
import sequelize from './connection.js';

const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  address: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      is: /^0x[a-fA-F0-9]{40}$/
    }
  },
  email: {
    type: DataTypes.STRING,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  username: {
    type: DataTypes.STRING,
    unique: true
  },
  passwordHash: {
    type: DataTypes.STRING
  },
  balance: {
    type: DataTypes.DECIMAL(18, 8),
    defaultValue: 0
  },
  role: {
    type: DataTypes.ENUM('user', 'admin', 'moderator'),
    defaultValue: 'user'
  },
  kycStatus: {
    type: DataTypes.ENUM('pending', 'verified', 'rejected'),
    defaultValue: 'pending'
  },
  kycData: {
    type: DataTypes.JSONB
  },
  lastLogin: {
    type: DataTypes.DATE
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'users',
  timestamps: true,
  indexes: [
    { fields: ['address'] },
    { fields: ['email'] },
    { fields: ['role'] }
  ]
});

const Log = sequelize.define('Log', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  type: {
    type: DataTypes.ENUM('INFO', 'SUCCESS', 'WARNING', 'ERROR'),
    allowNull: false
  },
  details: {
    type: DataTypes.JSONB,
    allowNull: false
  },
  userId: {
    type: DataTypes.UUID,
    references: {
      model: 'users',
      key: 'id'
    }
  }
}, {
  tableName: 'logs',
  timestamps: true,
  indexes: [
    { fields: ['type'] },
    { fields: ['createdAt'] },
    { fields: ['userId'] }
  ]
});

const Transaction = sequelize.define('Transaction', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  txHash: {
    type: DataTypes.STRING,
    unique: true
  },
  fromAddress: {
    type: DataTypes.STRING,
    allowNull: false
  },
  toAddress: {
    type: DataTypes.STRING,
    allowNull: false
  },
  amount: {
    type: DataTypes.DECIMAL(18, 8),
    allowNull: false
  },
  token: {
    type: DataTypes.STRING,
    defaultValue: 'AETH'
  },
  status: {
    type: DataTypes.ENUM('pending', 'confirmed', 'failed'),
    defaultValue: 'pending'
  },
  blockNumber: {
    type: DataTypes.INTEGER
  },
  gasUsed: {
    type: DataTypes.BIGINT
  },
  metadata: {
    type: DataTypes.JSONB
  }
}, {
  tableName: 'transactions',
  timestamps: true,
  indexes: [
    { fields: ['txHash'] },
    { fields: ['fromAddress'] },
    { fields: ['toAddress'] },
    { fields: ['status'] }
  ]
});

// Define associations
User.hasMany(Log, { foreignKey: 'userId', as: 'logs' });
Log.belongsTo(User, { foreignKey: 'userId', as: 'user' });

export { User, Log, Transaction, sequelize };
