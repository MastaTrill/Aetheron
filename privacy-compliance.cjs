/**
 * Enhanced Privacy & Compliance Module
 * Advanced privacy features and regulatory compliance tools
 */

const crypto = require('crypto');

/**
 * Enhanced ZK-Privacy System
 */
class EnhancedZKPrivacy {
  constructor(blockchain) {
    this.blockchain = blockchain;
    this.zkCircuits = new Map();
    this.proofs = new Map();
    this.verifiers = new Map();
    this.privacyPools = new Map();
  }

  /**
   * Create ZK-SNARK circuit for privacy-preserving transactions
   */
  createZKCircuit(circuitType, parameters) {
    const circuitId = crypto.randomBytes(16).toString('hex');

    const circuit = {
      id: circuitId,
      type: circuitType,
      parameters,
      status: 'compiling',
      createdAt: Date.now(),
      compiledAt: null,
      verificationKey: null
    };

    // Simulate circuit compilation
    setTimeout(() => {
      circuit.status = 'compiled';
      circuit.compiledAt = Date.now();
      circuit.verificationKey = this.generateVerificationKey();
    }, 5000);

    this.zkCircuits.set(circuitId, circuit);

    return circuit;
  }

  /**
   * Generate zero-knowledge proof
   */
  async generateZKProof(circuitId, publicInputs, privateInputs) {
    const circuit = this.zkCircuits.get(circuitId);
    if (!circuit) throw new Error('Circuit not found');
    if (circuit.status !== 'compiled') throw new Error('Circuit not compiled');

    const proofId = crypto.randomBytes(16).toString('hex');

    // Simulate proof generation (in real implementation, use snarkjs or similar)
    const proof = {
      id: proofId,
      circuitId,
      proof: this.generateMockProof(),
      publicInputs,
      publicSignals: this.computePublicSignals(publicInputs, privateInputs),
      generatedAt: Date.now(),
      verified: false
    };

    this.proofs.set(proofId, proof);

    return proof;
  }

  /**
   * Verify zero-knowledge proof
   */
  async verifyZKProof(proofId) {
    const proof = this.proofs.get(proofId);
    if (!proof) throw new Error('Proof not found');

    // Simulate verification
    const isValid = this.verifyMockProof(proof.proof, proof.publicSignals);

    proof.verified = isValid;
    proof.verifiedAt = Date.now();

    return {
      proofId,
      isValid,
      verifiedAt: proof.verifiedAt
    };
  }

  /**
   * Create privacy pool for confidential transactions
   */
  createPrivacyPool(poolConfig) {
    const poolId = crypto.randomBytes(16).toString('hex');

    const pool = {
      id: poolId,
      name: poolConfig.name,
      type: poolConfig.type || 'tornado', // tornado, zksync, etc.
      token: poolConfig.token,
      denominations: poolConfig.denominations || [1, 10, 100, 1000],
      deposits: new Map(),
      withdrawals: new Map(),
      merkleTree: this.createMerkleTree(),
      totalDeposits: 0,
      totalWithdrawals: 0,
      isActive: true,
      createdAt: Date.now()
    };

    this.privacyPools.set(poolId, pool);

    return pool;
  }

  /**
   * Deposit to privacy pool
   */
  async depositToPrivacyPool(poolId, depositor, amount, denomination) {
    const pool = this.privacyPools.get(poolId);
    if (!pool) throw new Error('Privacy pool not found');
    if (!pool.denominations.includes(denomination)) {
      throw new Error('Invalid denomination');
    }

    const commitment = this.generateCommitment(amount, depositor);
    const leaf = commitment;

    // Add to Merkle tree
    pool.merkleTree.insert(leaf);
    pool.totalDeposits += amount;

    const deposit = {
      commitment,
      depositor,
      amount,
      denomination,
      leafIndex: pool.merkleTree.getLeafCount() - 1,
      depositedAt: Date.now(),
      withdrawn: false
    };

    pool.deposits.set(commitment, deposit);

    return {
      poolId,
      commitment,
      leafIndex: deposit.leafIndex,
      merkleRoot: pool.merkleTree.getRoot()
    };
  }

  /**
   * Withdraw from privacy pool with ZK proof
   */
  async withdrawFromPrivacyPool(poolId, proof, recipient) {
    const pool = this.privacyPools.get(poolId);
    if (!pool) throw new Error('Privacy pool not found');

    // Verify ZK proof
    const proofVerification = await this.verifyZKProof(proof.id);
    if (!proofVerification.isValid) {
      throw new Error('Invalid ZK proof');
    }

    // Check nullifier hasn't been used
    const nullifier = proof.publicSignals.nullifier;
    if (pool.withdrawals.has(nullifier)) {
      throw new Error('Nullifier already used');
    }

    // Process withdrawal
    const withdrawal = {
      nullifier,
      recipient,
      amount: proof.publicSignals.amount,
      proofId: proof.id,
      withdrawnAt: Date.now()
    };

    pool.withdrawals.set(nullifier, withdrawal);
    pool.totalWithdrawals += withdrawal.amount;

    return {
      poolId,
      nullifier,
      recipient,
      amount: withdrawal.amount,
      txHash: `0x${crypto.randomBytes(32).toString('hex')}`
    };
  }

  /**
   * Create confidential DeFi transaction
   */
  async createConfidentialTransaction(txData) {
    const confidentialTx = {
      id: crypto.randomBytes(16).toString('hex'),
      type: txData.type, // 'swap', 'lend', 'borrow'
      encryptedData: this.encryptTransactionData(txData),
      zkProof: null,
      status: 'pending',
      createdAt: Date.now()
    };

    // Generate ZK proof for transaction validity
    const circuitId = await this.createConfidentialCircuit(txData.type);
    const proof = await this.generateZKProof(circuitId, txData.publicInputs, txData.privateInputs);

    confidentialTx.zkProof = proof;

    return confidentialTx;
  }

  /**
   * Execute confidential transaction
   */
  async executeConfidentialTransaction(confidentialTxId) {
    const tx = this.confidentialTxs.get(confidentialTxId);
    if (!tx) throw new Error('Confidential transaction not found');

    // Verify ZK proof
    const proofVerification = await this.verifyZKProof(tx.zkProof.id);
    if (!proofVerification.isValid) {
      throw new Error('Invalid ZK proof for confidential transaction');
    }

    // Decrypt and execute
    const decryptedData = this.decryptTransactionData(tx.encryptedData);
    const result = await this.executeDecryptedTransaction(decryptedData);

    tx.status = 'executed';
    tx.executedAt = Date.now();
    tx.result = result;

    return result;
  }

  /**
   * Generate commitment for privacy
   */
  generateCommitment(value, secret) {
    const data = JSON.stringify({ value, secret, randomness: crypto.randomBytes(32).toString('hex') });
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Create Merkle tree for privacy pool
   */
  createMerkleTree() {
    return {
      leaves: [],
      insert: function(leaf) {
        this.leaves.push(leaf);
      },
      getLeafCount: function() {
        return this.leaves.length;
      },
      getRoot: function() {
        // Simplified root calculation
        return crypto.createHash('sha256').update(this.leaves.join('')).digest('hex');
      }
    };
  }

  /**
   * Mock proof generation
   */
  generateMockProof() {
    return {
      pi_a: [crypto.randomBytes(32).toString('hex'), crypto.randomBytes(32).toString('hex')],
      pi_b: [
        [crypto.randomBytes(32).toString('hex'), crypto.randomBytes(32).toString('hex')],
        [crypto.randomBytes(32).toString('hex'), crypto.randomBytes(32).toString('hex')]
      ],
      pi_c: [crypto.randomBytes(32).toString('hex'), crypto.randomBytes(32).toString('hex')]
    };
  }

  /**
   * Mock proof verification
   */
  verifyMockProof(proof, publicSignals) {
    // Simplified verification - in real implementation, use actual ZK verification
    return Math.random() > 0.05; // 95% success rate
  }

  /**
   * Generate verification key
   */
  generateVerificationKey() {
    return {
      protocol: 'groth16',
      curve: 'bn128',
      nPublic: 2,
      vk_alpha_1: crypto.randomBytes(64).toString('hex'),
      vk_beta_2: crypto.randomBytes(128).toString('hex'),
      vk_gamma_2: crypto.randomBytes(128).toString('hex'),
      vk_delta_2: crypto.randomBytes(128).toString('hex'),
      vk_alphabeta_12: crypto.randomBytes(256).toString('hex'),
      IC: [crypto.randomBytes(64).toString('hex')]
    };
  }

  /**
   * Compute public signals
   */
  computePublicSignals(publicInputs, privateInputs) {
    // Simplified computation
    return {
      root: crypto.createHash('sha256').update(JSON.stringify(publicInputs)).digest('hex'),
      nullifier: crypto.createHash('sha256').update(JSON.stringify(privateInputs)).digest('hex'),
      amount: publicInputs.amount || 0
    };
  }

  /**
   * Encrypt transaction data
   */
  encryptTransactionData(data) {
    const key = crypto.randomBytes(32);
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher('aes-256-cbc', key);
    let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return { encrypted, key: key.toString('hex'), iv: iv.toString('hex') };
  }

  /**
   * Decrypt transaction data
   */
  decryptTransactionData(encryptedData) {
    const key = Buffer.from(encryptedData.key, 'hex');
    const iv = Buffer.from(encryptedData.iv, 'hex');
    const decipher = crypto.createDecipher('aes-256-cbc', key);
    let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return JSON.parse(decrypted);
  }

  /**
   * Create confidential circuit
   */
  async createConfidentialCircuit(txType) {
    const circuitConfig = {
      swap: { nPublic: 4, nPrivate: 2 },
      lend: { nPublic: 3, nPrivate: 1 },
      borrow: { nPublic: 3, nPrivate: 1 }
    };

    return this.createZKCircuit('confidential-' + txType, circuitConfig[txType]);
  }

  /**
   * Execute decrypted transaction
   */
  async executeDecryptedTransaction(data) {
    // Simulate execution based on transaction type
    await new Promise(resolve => setTimeout(resolve, 1000));

    return {
      txHash: `0x${crypto.randomBytes(32).toString('hex')}`,
      type: data.type,
      success: true,
      gasUsed: 150000
    };
  }
}

/**
 * Regulatory Compliance Engine
 */
class RegulatoryComplianceEngine {
  constructor() {
    this.complianceRules = new Map();
    this.kycData = new Map();
    this.amlChecks = new Map();
    this.reportingQueue = [];
    this.jurisdictions = new Map();
  }

  /**
   * Register compliance jurisdiction
   */
  registerJurisdiction(jurisdictionCode, rules) {
    this.jurisdictions.set(jurisdictionCode, {
      code: jurisdictionCode,
      name: rules.name,
      rules: rules.requirements,
      kycRequired: rules.kycRequired || false,
      amlThreshold: rules.amlThreshold || 10000,
      reportingRequirements: rules.reportingRequirements || [],
      registeredAt: Date.now()
    });

    return this.jurisdictions.get(jurisdictionCode);
  }

  /**
   * Perform KYC check
   */
  async performKYCCheck(userId, jurisdiction, userData) {
    const jurisdictionRules = this.jurisdictions.get(jurisdiction);
    if (!jurisdictionRules || !jurisdictionRules.kycRequired) {
      return { approved: true, level: 'not-required' };
    }

    // Simulate KYC verification process
    const kycResult = {
      userId,
      jurisdiction,
      status: 'pending',
      checks: {
        identity: await this.verifyIdentity(userData),
        address: await this.verifyAddress(userData),
        sanctions: await this.checkSanctions(userData),
        pep: await this.checkPEP(userData)
      },
      submittedAt: Date.now(),
      completedAt: null
    };

    // Process checks
    setTimeout(() => {
      this.completeKYCCheck(kycResult);
    }, 5000);

    this.kycData.set(userId, kycResult);

    return kycResult;
  }

  /**
   * Complete KYC check
   */
  completeKYCCheck(kycResult) {
    // Simulate completion
    const allPassed = Object.values(kycResult.checks).every(check => check.passed);

    kycResult.status = allPassed ? 'approved' : 'rejected';
    kycResult.completedAt = Date.now();
    kycResult.level = allPassed ? 'verified' : 'failed';
  }

  /**
   * Perform AML screening
   */
  async performAMLScreening(transaction, jurisdiction) {
    const jurisdictionRules = this.jurisdictions.get(jurisdiction);
    const threshold = jurisdictionRules?.amlThreshold || 10000;

    if (transaction.amount < threshold) {
      return { flagged: false, reason: 'below-threshold' };
    }

    const amlCheck = {
      transactionId: transaction.id,
      amount: transaction.amount,
      from: transaction.from,
      to: transaction.to,
      jurisdiction,
      checks: {
        unusualPattern: this.detectUnusualPattern(transaction),
        highRiskCountry: this.checkHighRiskCountry(transaction),
        sanctionedEntity: await this.checkSanctionedEntity(transaction),
        structuring: this.detectStructuring(transaction)
      },
      flagged: false,
      riskScore: 0,
      checkedAt: Date.now()
    };

    // Calculate risk score
    amlCheck.riskScore = Object.values(amlCheck.checks).reduce((score, check) => {
      return score + (check.flagged ? check.severity : 0);
    }, 0);

    amlCheck.flagged = amlCheck.riskScore >= 50;

    this.amlChecks.set(transaction.id, amlCheck);

    // Queue for reporting if flagged
    if (amlCheck.flagged) {
      this.reportingQueue.push({
        type: 'aml',
        data: amlCheck,
        jurisdiction,
        timestamp: Date.now()
      });
    }

    return amlCheck;
  }

  /**
   * Generate compliance report
   */
  generateComplianceReport(jurisdiction, period) {
    const reports = this.reportingQueue.filter(report =>
      report.jurisdiction === jurisdiction &&
      report.timestamp >= period.start &&
      report.timestamp <= period.end
    );

    return {
      jurisdiction,
      period,
      totalTransactions: reports.length,
      flaggedTransactions: reports.filter(r => r.type === 'aml').length,
      kycCompletions: this.getKYCCompletions(jurisdiction, period),
      reports,
      generatedAt: Date.now()
    };
  }

  /**
   * Implement travel rule compliance
   */
  async implementTravelRule(transaction) {
    const travelRuleData = {
      transactionId: transaction.id,
      originator: {
        name: await this.getUserName(transaction.from),
        address: transaction.from
      },
      beneficiary: {
        name: await this.getUserName(transaction.to),
        address: transaction.to
      },
      amount: transaction.amount,
      asset: transaction.asset,
      timestamp: Date.now()
    };

    // Encrypt and store VASPs can exchange
    const encryptedData = this.encryptTravelRuleData(travelRuleData);

    return {
      transactionId: transaction.id,
      travelRuleData: encryptedData,
      compliance: 'travel-rule-implemented'
    };
  }

  /**
   * Privacy-preserving analytics
   */
  async generatePrivateAnalytics(query, jurisdiction) {
    // Use zero-knowledge proofs to generate analytics without revealing individual data
    const analytics = {
      totalTransactions: await this.computePrivateSum('transactionCount'),
      totalVolume: await this.computePrivateSum('transactionVolume'),
      activeUsers: await this.computePrivateCount('uniqueUsers'),
      riskDistribution: await this.computePrivateHistogram('riskScores'),
      generatedWithZK: true,
      jurisdiction,
      timestamp: Date.now()
    };

    return analytics;
  }

  /**
   * Mock verification functions
   */
  async verifyIdentity(userData) {
    await new Promise(resolve => setTimeout(resolve, 1000));
    return { passed: Math.random() > 0.1, severity: 20 }; // 90% pass rate
  }

  async verifyAddress(userData) {
    await new Promise(resolve => setTimeout(resolve, 800));
    return { passed: Math.random() > 0.05, severity: 15 }; // 95% pass rate
  }

  async checkSanctions(userData) {
    await new Promise(resolve => setTimeout(resolve, 1200));
    return { passed: Math.random() > 0.98, severity: 100 }; // 98% pass rate
  }

  async checkPEP(userData) {
    await new Promise(resolve => setTimeout(resolve, 1000));
    return { passed: Math.random() > 0.95, severity: 80 }; // 95% pass rate
  }

  /**
   * Mock AML detection functions
   */
  detectUnusualPattern(transaction) {
    const isUnusual = Math.random() < 0.1; // 10% unusual
    return { flagged: isUnusual, severity: isUnusual ? 30 : 0 };
  }

  checkHighRiskCountry(transaction) {
    const highRiskCountries = ['North Korea', 'Iran', 'Venezuela'];
    const isHighRisk = highRiskCountries.some(country =>
      transaction.from.includes(country) || transaction.to.includes(country)
    );
    return { flagged: isHighRisk, severity: isHighRisk ? 50 : 0 };
  }

  async checkSanctionedEntity(transaction) {
    await new Promise(resolve => setTimeout(resolve, 500));
    const isSanctioned = Math.random() < 0.02; // 2% sanctioned
    return { flagged: isSanctioned, severity: isSanctioned ? 100 : 0 };
  }

  detectStructuring(transaction) {
    const isStructuring = transaction.amount < 10000 && Math.random() < 0.05;
    return { flagged: isStructuring, severity: isStructuring ? 25 : 0 };
  }

  /**
   * Mock helper functions
   */
  getKYCCompletions(jurisdiction, period) {
    return Math.floor(Math.random() * 100);
  }

  async getUserName(address) {
    // Mock name resolution
    return `User_${address.slice(-8)}`;
  }

  encryptTravelRuleData(data) {
    return this.encryptTransactionData(data);
  }

  async computePrivateSum(field) {
    // Mock ZK sum computation
    await new Promise(resolve => setTimeout(resolve, 500));
    return Math.floor(Math.random() * 10000);
  }

  async computePrivateCount(field) {
    // Mock ZK count computation
    await new Promise(resolve => setTimeout(resolve, 500));
    return Math.floor(Math.random() * 1000);
  }

  async computePrivateHistogram(field) {
    // Mock ZK histogram computation
    await new Promise(resolve => setTimeout(resolve, 500));
    return {
      'low': Math.floor(Math.random() * 300),
      'medium': Math.floor(Math.random() * 400),
      'high': Math.floor(Math.random() * 200),
      'critical': Math.floor(Math.random() * 100)
    };
  }
}

/**
 * Decentralized Identity System
 */
class DecentralizedIdentitySystem {
  constructor(blockchain) {
    this.blockchain = blockchain;
    this.identities = new Map();
    this.credentials = new Map();
    this.issuers = new Map();
    this.verifiers = new Map();
  }

  /**
   * Create decentralized identity
   */
  async createDecentralizedIdentity(owner, profileData) {
    const did = `did:aetheron:${crypto.randomBytes(32).toString('hex')}`;

    const identity = {
      did,
      owner,
      profile: profileData,
      credentials: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      status: 'active',
      verificationMethods: [],
      services: []
    };

    // Add default verification method
    identity.verificationMethods.push({
      id: `${did}#key-1`,
      type: 'Ed25519VerificationKey2020',
      controller: did,
      publicKeyMultibase: this.generatePublicKey()
    });

    this.identities.set(did, identity);

    return identity;
  }

  /**
   * Issue verifiable credential
   */
  async issueVerifiableCredential(issuerDid, subjectDid, credentialData) {
    const issuer = this.identities.get(issuerDid);
    if (!issuer) throw new Error('Issuer not found');

    const subject = this.identities.get(subjectDid);
    if (!subject) throw new Error('Subject not found');

    const vcId = `urn:uuid:${crypto.randomBytes(16).toString('hex')}`;

    const verifiableCredential = {
      '@context': ['https://www.w3.org/2018/credentials/v1'],
      id: vcId,
      type: ['VerifiableCredential', credentialData.type],
      issuer: issuerDid,
      issuanceDate: new Date().toISOString(),
      credentialSubject: {
        id: subjectDid,
        ...credentialData.claims
      },
      proof: await this.generateCredentialProof(verifiableCredential, issuer)
    };

    // Store credential
    const credId = crypto.randomBytes(16).toString('hex');
    this.credentials.set(credId, {
      id: credId,
      vc: verifiableCredential,
      issuer: issuerDid,
      subject: subjectDid,
      status: 'issued',
      issuedAt: Date.now()
    });

    // Add to subject's credentials
    subject.credentials.push(credId);

    return verifiableCredential;
  }

  /**
   * Verify verifiable credential
   */
  async verifyVerifiableCredential(vc) {
    try {
      // Verify issuer signature
      const isIssuerSignatureValid = await this.verifyCredentialProof(vc);

      // Check if credential is not revoked
      const isNotRevoked = !this.isCredentialRevoked(vc.id);

      // Check expiration
      const isNotExpired = !vc.expirationDate || new Date(vc.expirationDate) > new Date();

      return {
        verified: isIssuerSignatureValid && isNotRevoked && isNotExpired,
        checks: {
          issuerSignature: isIssuerSignatureValid,
          notRevoked: isNotRevoked,
          notExpired: isNotExpired
        }
      };
    } catch (error) {
      return {
        verified: false,
        error: error.message
      };
    }
  }

  /**
   * Create verifiable presentation
   */
  async createVerifiablePresentation(holderDid, credentials, challenge) {
    const holder = this.identities.get(holderDid);
    if (!holder) throw new Error('Holder not found');

    const vpId = `urn:uuid:${crypto.randomBytes(16).toString('hex')}`;

    const verifiablePresentation = {
      '@context': ['https://www.w3.org/2018/credentials/v1'],
      id: vpId,
      type: ['VerifiablePresentation'],
      holder: holderDid,
      verifiableCredential: credentials,
      proof: await this.generatePresentationProof(verifiablePresentation, holder, challenge)
    };

    return verifiablePresentation;
  }

  /**
   * Selective disclosure
   */
  createSelectiveDisclosure(credential, disclosedFields) {
    const selectiveVC = {
      ...credential,
      credentialSubject: {}
    };

    // Only include disclosed fields
    disclosedFields.forEach(field => {
      if (credential.credentialSubject[field]) {
        selectiveVC.credentialSubject[field] = credential.credentialSubject[field];
      }
    });

    return selectiveVC;
  }

  /**
   * Zero-knowledge proof for credentials
   */
  async createZKPCredential(credential, disclosedFields) {
    const zkpCredential = {
      ...credential,
      credentialSubject: this.createSelectiveDisclosure(credential.credentialSubject, disclosedFields),
      proof: {
        type: 'ZKSnarkProof2023',
        proofPurpose: 'assertionMethod',
        verificationMethod: credential.issuer,
        zkProof: await this.generateZKProofForCredential(credential, disclosedFields)
      }
    };

    return zkpCredential;
  }

  /**
   * Register identity service
   */
  registerIdentityService(did, service) {
    const identity = this.identities.get(did);
    if (!identity) throw new Error('Identity not found');

    identity.services.push({
      id: `${did}#${service.type}`,
      type: service.type,
      serviceEndpoint: service.endpoint,
      registeredAt: Date.now()
    });

    return identity;
  }

  /**
   * Resolve DID
   */
  async resolveDID(did) {
    const identity = this.identities.get(did);
    if (!identity) throw new Error('DID not found');

    return {
      '@context': 'https://www.w3.org/ns/did/v1',
      id: did,
      ...identity
    };
  }

  /**
   * Mock cryptographic functions
   */
  generatePublicKey() {
    return `z${crypto.randomBytes(32).toString('base64url')}`;
  }

  async generateCredentialProof(credential, issuer) {
    // Mock proof generation
    return {
      type: 'Ed25519Signature2020',
      created: new Date().toISOString(),
      verificationMethod: `${issuer.did}#key-1`,
      proofPurpose: 'assertionMethod',
      proofValue: crypto.randomBytes(64).toString('hex')
    };
  }

  async verifyCredentialProof(vc) {
    // Mock verification
    return Math.random() > 0.05; // 95% success rate
  }

  isCredentialRevoked(credentialId) {
    // Mock revocation check
    return Math.random() < 0.02; // 2% revoked
  }

  async generatePresentationProof(vp, holder, challenge) {
    // Mock proof generation
    return {
      type: 'Ed25519Signature2020',
      created: new Date().toISOString(),
      verificationMethod: `${holder.did}#key-1`,
      proofPurpose: 'authentication',
      challenge: challenge,
      proofValue: crypto.randomBytes(64).toString('hex')
    };
  }

  async generateZKProofForCredential(credential, disclosedFields) {
    // Mock ZK proof for selective disclosure
    return {
      proof: crypto.randomBytes(128).toString('hex'),
      publicSignals: disclosedFields,
      disclosedFields
    };
  }
}

module.exports = {
  EnhancedZKPrivacy,
  RegulatoryComplianceEngine,
  DecentralizedIdentitySystem
};
