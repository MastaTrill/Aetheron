/**
 * Developer Experience Improvements for Aetheron
 * Features: Plugin Marketplace, Enhanced API Documentation, SDK Updates
 */

const EventEmitter = require('events');
const crypto = require('crypto');

/**
 * Plugin Marketplace System
 */
class PluginMarketplaceSystem extends EventEmitter {
  constructor() {
    super();
    this.plugins = new Map();
    this.categories = new Map();
    this.developerProfiles = new Map();
    this.installations = new Map();
    this.reviews = new Map();
    this.featuredPlugins = new Set();
  }

  /**
   * Register plugin
   */
  async registerPlugin(pluginData) {
    const pluginId = `PLUGIN_${crypto.randomBytes(8).toString('hex')}`;

    const plugin = {
      id: pluginId,
      name: pluginData.name,
      description: pluginData.description,
      version: pluginData.version || '1.0.0',
      author: pluginData.author,
      category: pluginData.category,
      tags: pluginData.tags || [],
      price: pluginData.price || 0, // 0 for free
      license: pluginData.license || 'MIT',
      repository: pluginData.repository,
      documentation: pluginData.documentation,
      screenshots: pluginData.screenshots || [],
      features: pluginData.features || [],
      requirements: pluginData.requirements || {},
      compatibility: pluginData.compatibility || ['ethereum', 'polygon', 'bsc'],
      status: 'pending_review',
      downloads: 0,
      rating: 0,
      reviewCount: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      files: pluginData.files || {},
      metadata: pluginData.metadata || {}
    };

    this.plugins.set(pluginId, plugin);

    // Add to category
    const categoryPlugins = this.categories.get(plugin.category) || [];
    categoryPlugins.push(pluginId);
    this.categories.set(plugin.category, categoryPlugins);

    this.emit('pluginRegistered', { pluginId, plugin });

    return plugin;
  }

  /**
   * Approve plugin
   */
  async approvePlugin(pluginId, reviewerId) {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) throw new Error('Plugin not found');

    plugin.status = 'approved';
    plugin.approvedAt = Date.now();
    plugin.approvedBy = reviewerId;

    // Add to featured if high quality
    if (plugin.rating >= 4.5 && plugin.downloads > 100) {
      this.featuredPlugins.add(pluginId);
    }

    this.emit('pluginApproved', { pluginId, reviewerId });

    return plugin;
  }

  /**
   * Install plugin
   */
  async installPlugin(pluginId, userId, environment = 'production') {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) throw new Error('Plugin not found');
    if (plugin.status !== 'approved') throw new Error('Plugin not approved');

    const installationId = `INSTALL_${crypto.randomBytes(8).toString('hex')}`;

    const installation = {
      id: installationId,
      pluginId,
      userId,
      environment,
      status: 'installing',
      installedAt: Date.now(),
      version: plugin.version,
      configuration: {},
      permissions: plugin.requirements.permissions || []
    };

    // Simulate installation process
    setTimeout(async () => {
      try {
        await this.completePluginInstallation(installationId);
      } catch (error) {
        installation.status = 'failed';
        installation.error = error.message;
      }
    }, 2000);

    // Track installations
    const userInstallations = this.installations.get(userId) || [];
    userInstallations.push(installationId);
    this.installations.set(userId, userInstallations);

    // Increment download count
    plugin.downloads++;

    this.emit('pluginInstalling', { installationId, pluginId, userId });

    return installation;
  }

  /**
   * Complete plugin installation
   */
  async completePluginInstallation(installationId) {
    // Find installation
    let installation = null;
    for (const userInstallations of this.installations.values()) {
      installation = userInstallations.find(inst => typeof inst === 'object' ? inst.id === installationId : false);
      if (installation) break;
    }

    if (!installation) return;

    installation.status = 'installed';
    installation.completedAt = Date.now();

    this.emit('pluginInstalled', { installationId, pluginId: installation.pluginId });
  }

  /**
   * Submit plugin review
   */
  async submitReview(pluginId, userId, reviewData) {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) throw new Error('Plugin not found');

    const reviewId = `REVIEW_${crypto.randomBytes(8).toString('hex')}`;

    const review = {
      id: reviewId,
      pluginId,
      userId,
      rating: Math.max(1, Math.min(5, reviewData.rating)),
      title: reviewData.title,
      comment: reviewData.comment,
      pros: reviewData.pros || [],
      cons: reviewData.cons || [],
      helpful: 0,
      createdAt: Date.now(),
      verified: this.hasUserInstalledPlugin(userId, pluginId)
    };

    // Store review
    const pluginReviews = this.reviews.get(pluginId) || [];
    pluginReviews.push(review);
    this.reviews.set(pluginId, pluginReviews);

    // Update plugin rating
    this.updatePluginRating(pluginId);

    this.emit('reviewSubmitted', { reviewId, pluginId, userId });

    return review;
  }

  /**
   * Update plugin rating
   */
  updatePluginRating(pluginId) {
    const reviews = this.reviews.get(pluginId) || [];
    if (reviews.length === 0) return;

    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = totalRating / reviews.length;

    const plugin = this.plugins.get(pluginId);
    plugin.rating = Math.round(averageRating * 10) / 10; // Round to 1 decimal
    plugin.reviewCount = reviews.length;
  }

  /**
   * Has user installed plugin
   */
  hasUserInstalledPlugin(userId, pluginId) {
    const userInstallations = this.installations.get(userId) || [];
    return userInstallations.some(installationId => {
      const installation = typeof installationId === 'string' ?
        this.getInstallationById(installationId) : installationId;
      return installation && installation.pluginId === pluginId && installation.status === 'installed';
    });
  }

  /**
   * Get installation by ID
   */
  getInstallationById(installationId) {
    for (const userInstallations of this.installations.values()) {
      const installation = userInstallations.find(inst =>
        typeof inst === 'object' ? inst.id === installationId : false
      );
      if (installation) return installation;
    }
    return null;
  }

  /**
   * Search plugins
   */
  searchPlugins(query, filters = {}) {
    let plugins = Array.from(this.plugins.values());

    // Filter by status
    plugins = plugins.filter(p => p.status === 'approved');

    // Text search
    if (query) {
      const searchTerm = query.toLowerCase();
      plugins = plugins.filter(p =>
        p.name.toLowerCase().includes(searchTerm) ||
        p.description.toLowerCase().includes(searchTerm) ||
        p.tags.some(tag => tag.toLowerCase().includes(searchTerm))
      );
    }

    // Category filter
    if (filters.category) {
      plugins = plugins.filter(p => p.category === filters.category);
    }

    // Tag filter
    if (filters.tags && filters.tags.length > 0) {
      plugins = plugins.filter(p =>
        filters.tags.some(tag => p.tags.includes(tag))
      );
    }

    // Price filter
    if (filters.priceRange) {
      const [min, max] = filters.priceRange;
      plugins = plugins.filter(p => p.price >= min && p.price <= max);
    }

    // Rating filter
    if (filters.minRating) {
      plugins = plugins.filter(p => p.rating >= filters.minRating);
    }

    // Sort
    const sortBy = filters.sortBy || 'downloads';
    plugins.sort((a, b) => {
      switch (sortBy) {
      case 'rating':
        return b.rating - a.rating;
      case 'downloads':
        return b.downloads - a.downloads;
      case 'newest':
        return b.createdAt - a.createdAt;
      case 'price':
        return a.price - b.price;
      default:
        return b.downloads - a.downloads;
      }
    });

    return plugins;
  }

  /**
   * Get plugin details
   */
  getPluginDetails(pluginId) {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) return null;

    const reviews = this.reviews.get(pluginId) || [];
    const installations = this.getPluginInstallations(pluginId);

    return {
      ...plugin,
      reviews: reviews.slice(0, 10), // Top 10 reviews
      totalReviews: reviews.length,
      installations: installations.length,
      isFeatured: this.featuredPlugins.has(pluginId)
    };
  }

  /**
   * Get plugin installations
   */
  getPluginInstallations(pluginId) {
    const installations = [];

    for (const [userId, userInstallations] of this.installations) {
      const userInst = userInstallations.filter(installationId => {
        const installation = typeof installationId === 'string' ?
          this.getInstallationById(installationId) : installationId;
        return installation && installation.pluginId === pluginId && installation.status === 'installed';
      });

      installations.push(...userInst);
    }

    return installations;
  }

  /**
   * Get marketplace statistics
   */
  getMarketplaceStats() {
    const plugins = Array.from(this.plugins.values());
    const approvedPlugins = plugins.filter(p => p.status === 'approved');

    const totalInstallations = Array.from(this.installations.values())
      .reduce((sum, userInst) => sum + userInst.length, 0);

    const categories = {};
    approvedPlugins.forEach(plugin => {
      categories[plugin.category] = (categories[plugin.category] || 0) + 1;
    });

    return {
      totalPlugins: plugins.length,
      approvedPlugins: approvedPlugins.length,
      totalInstallations,
      totalDownloads: approvedPlugins.reduce((sum, p) => sum + p.downloads, 0),
      averageRating: approvedPlugins.length > 0 ?
        approvedPlugins.reduce((sum, p) => sum + p.rating, 0) / approvedPlugins.length : 0,
      categories,
      featuredPlugins: this.featuredPlugins.size
    };
  }

  /**
   * Get featured plugins
   */
  getFeaturedPlugins(limit = 10) {
    const featured = Array.from(this.featuredPlugins)
      .map(pluginId => this.plugins.get(pluginId))
      .filter(Boolean)
      .sort((a, b) => b.rating - a.rating)
      .slice(0, limit);

    return featured;
  }
}

/**
 * Enhanced API Documentation System
 */
class EnhancedAPIDocumentationSystem extends EventEmitter {
  constructor() {
    super();
    this.endpoints = new Map();
    this.schemas = new Map();
    this.examples = new Map();
    this.changelogs = new Map();
    this.interactiveDocs = new Map();
  }

  /**
   * Register API endpoint
   */
  async registerEndpoint(endpointData) {
    const endpointId = `ENDPOINT_${crypto.randomBytes(8).toString('hex')}`;

    const endpoint = {
      id: endpointId,
      path: endpointData.path,
      method: endpointData.method.toUpperCase(),
      summary: endpointData.summary,
      description: endpointData.description,
      tags: endpointData.tags || [],
      parameters: endpointData.parameters || [],
      requestBody: endpointData.requestBody,
      responses: endpointData.responses || {},
      security: endpointData.security || [],
      deprecated: endpointData.deprecated || false,
      version: endpointData.version || 'v1',
      category: endpointData.category || 'general',
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    this.endpoints.set(endpointId, endpoint);

    // Generate interactive documentation
    await this.generateInteractiveDocs(endpointId);

    this.emit('endpointRegistered', { endpointId, endpoint });

    return endpoint;
  }

  /**
   * Register data schema
   */
  async registerSchema(schemaData) {
    const schemaId = `SCHEMA_${crypto.randomBytes(8).toString('hex')}`;

    const schema = {
      id: schemaId,
      name: schemaData.name,
      type: schemaData.type || 'object',
      properties: schemaData.properties || {},
      required: schemaData.required || [],
      example: schemaData.example,
      description: schemaData.description,
      version: schemaData.version || 'v1',
      createdAt: Date.now()
    };

    this.schemas.set(schemaId, schema);

    return schema;
  }

  /**
   * Add code example
   */
  async addCodeExample(endpointId, exampleData) {
    const exampleId = `EXAMPLE_${crypto.randomBytes(8).toString('hex')}`;

    const example = {
      id: exampleId,
      endpointId,
      language: exampleData.language,
      title: exampleData.title,
      description: exampleData.description,
      code: exampleData.code,
      output: exampleData.output,
      createdAt: Date.now()
    };

    const endpointExamples = this.examples.get(endpointId) || [];
    endpointExamples.push(example);
    this.examples.set(endpointId, endpointExamples);

    return example;
  }

  /**
   * Generate interactive documentation
   */
  async generateInteractiveDocs(endpointId) {
    const endpoint = this.endpoints.get(endpointId);
    if (!endpoint) return;

    const interactiveDoc = {
      endpointId,
      tryItOut: {
        url: `https://api.aetheron.io${endpoint.path}`,
        method: endpoint.method,
        parameters: this.generateParameterInputs(endpoint.parameters),
        requestBody: this.generateRequestBodyInput(endpoint.requestBody),
        auth: this.generateAuthInputs(endpoint.security)
      },
      responseExamples: this.generateResponseExamples(endpoint.responses),
      generatedAt: Date.now()
    };

    this.interactiveDocs.set(endpointId, interactiveDoc);

    return interactiveDoc;
  }

  /**
   * Generate parameter inputs for interactive docs
   */
  generateParameterInputs(parameters) {
    return parameters.map(param => ({
      name: param.name,
      type: param.schema?.type || 'string',
      required: param.required || false,
      description: param.description,
      example: param.example || this.generateExampleValue(param.schema)
    }));
  }

  /**
   * Generate request body input
   */
  generateRequestBodyInput(requestBody) {
    if (!requestBody?.content?.['application/json']?.schema) return null;

    const schema = requestBody.content['application/json'].schema;
    return {
      contentType: 'application/json',
      schema: schema,
      example: this.generateSchemaExample(schema)
    };
  }

  /**
   * Generate auth inputs
   */
  generateAuthInputs(security) {
    const authInputs = [];

    security.forEach(sec => {
      if (sec.apiKey) {
        authInputs.push({
          type: 'apiKey',
          name: sec.apiKey.name,
          in: sec.apiKey.in,
          description: 'API Key for authentication'
        });
      }

      if (sec.bearerAuth) {
        authInputs.push({
          type: 'bearer',
          name: 'Authorization',
          description: 'Bearer token for authentication'
        });
      }

      if (sec.oauth2) {
        authInputs.push({
          type: 'oauth2',
          flows: sec.oauth2,
          description: 'OAuth 2.0 authentication'
        });
      }
    });

    return authInputs;
  }

  /**
   * Generate response examples
   */
  generateResponseExamples(responses) {
    const examples = {};

    Object.entries(responses).forEach(([statusCode, response]) => {
      if (response.content?.['application/json']?.schema) {
        examples[statusCode] = {
          description: response.description,
          example: this.generateSchemaExample(response.content['application/json'].schema)
        };
      }
    });

    return examples;
  }

  /**
   * Generate example value from schema
   */
  generateExampleValue(schema) {
    if (!schema) return '';

    switch (schema.type) {
    case 'string':
      return schema.example || 'example_string';
    case 'number':
    case 'integer':
      return schema.example || 42;
    case 'boolean':
      return schema.example || true;
    case 'array':
      return schema.example || [this.generateExampleValue(schema.items)];
    case 'object':
      return this.generateSchemaExample(schema);
    default:
      return '';
    }
  }

  /**
   * Generate schema example
   */
  generateSchemaExample(schema) {
    if (!schema) return {};

    const example = {};

    if (schema.properties) {
      Object.entries(schema.properties).forEach(([prop, propSchema]) => {
        example[prop] = this.generateExampleValue(propSchema);
      });
    }

    return example;
  }

  /**
   * Search API documentation
   */
  searchAPIDocs(query, filters = {}) {
    let endpoints = Array.from(this.endpoints.values());

    // Text search
    if (query) {
      const searchTerm = query.toLowerCase();
      endpoints = endpoints.filter(e =>
        e.path.toLowerCase().includes(searchTerm) ||
        e.summary.toLowerCase().includes(searchTerm) ||
        e.description.toLowerCase().includes(searchTerm) ||
        e.tags.some(tag => tag.toLowerCase().includes(searchTerm))
      );
    }

    // Filter by method
    if (filters.method) {
      endpoints = endpoints.filter(e => e.method === filters.method.toUpperCase());
    }

    // Filter by category
    if (filters.category) {
      endpoints = endpoints.filter(e => e.category === filters.category);
    }

    // Filter by tags
    if (filters.tags && filters.tags.length > 0) {
      endpoints = endpoints.filter(e =>
        filters.tags.some(tag => e.tags.includes(tag))
      );
    }

    // Filter deprecated
    if (filters.includeDeprecated === false) {
      endpoints = endpoints.filter(e => !e.deprecated);
    }

    return endpoints;
  }

  /**
   * Get endpoint documentation
   */
  getEndpointDocs(endpointId) {
    const endpoint = this.endpoints.get(endpointId);
    if (!endpoint) return null;

    const examples = this.examples.get(endpointId) || [];
    const interactiveDoc = this.interactiveDocs.get(endpointId);

    return {
      ...endpoint,
      examples,
      interactiveDoc,
      relatedSchemas: this.findRelatedSchemas(endpoint)
    };
  }

  /**
   * Find related schemas
   */
  findRelatedSchemas(endpoint) {
    const relatedSchemas = [];

    // Check parameters
    endpoint.parameters?.forEach(param => {
      if (param.schema?.$ref) {
        const schemaId = param.schema.$ref.split('/').pop();
        const schema = this.schemas.get(schemaId);
        if (schema) relatedSchemas.push(schema);
      }
    });

    // Check request body
    if (endpoint.requestBody?.content?.['application/json']?.schema?.$ref) {
      const schemaId = endpoint.requestBody.content['application/json'].schema.$ref.split('/').pop();
      const schema = this.schemas.get(schemaId);
      if (schema) relatedSchemas.push(schema);
    }

    // Check responses
    Object.values(endpoint.responses || {}).forEach(response => {
      if (response.content?.['application/json']?.schema?.$ref) {
        const schemaId = response.content['application/json'].schema.$ref.split('/').pop();
        const schema = this.schemas.get(schemaId);
        if (schema) relatedSchemas.push(schema);
      }
    });

    return relatedSchemas;
  }

  /**
   * Generate OpenAPI specification
   */
  generateOpenAPISpec(version = '3.0.3') {
    const endpoints = Array.from(this.endpoints.values());
    const schemas = Array.from(this.schemas.values());

    const spec = {
      openapi: version,
      info: {
        title: 'Aetheron API',
        version: 'v1.0.0',
        description: 'Comprehensive blockchain platform API'
      },
      servers: [
        {
          url: 'https://api.aetheron.io/v1',
          description: 'Production server'
        }
      ],
      paths: {},
      components: {
        schemas: {},
        securitySchemes: {
          apiKey: {
            type: 'apiKey',
            in: 'header',
            name: 'X-API-Key'
          },
          bearerAuth: {
            type: 'http',
            scheme: 'bearer'
          }
        }
      }
    };

    // Add schemas
    schemas.forEach(schema => {
      spec.components.schemas[schema.name] = {
        type: schema.type,
        properties: schema.properties,
        required: schema.required,
        example: schema.example
      };
    });

    // Group endpoints by path
    const paths = {};
    endpoints.forEach(endpoint => {
      if (!paths[endpoint.path]) {
        paths[endpoint.path] = {};
      }

      paths[endpoint.path][endpoint.method.toLowerCase()] = {
        summary: endpoint.summary,
        description: endpoint.description,
        tags: endpoint.tags,
        parameters: endpoint.parameters,
        requestBody: endpoint.requestBody,
        responses: endpoint.responses,
        security: endpoint.security,
        deprecated: endpoint.deprecated
      };
    });

    spec.paths = paths;

    return spec;
  }

  /**
   * Record API changelog
   */
  async recordAPIChange(changeData) {
    const changeId = `CHANGE_${crypto.randomBytes(8).toString('hex')}`;

    const change = {
      id: changeId,
      version: changeData.version,
      type: changeData.type, // 'added', 'changed', 'deprecated', 'removed'
      endpoint: changeData.endpoint,
      description: changeData.description,
      breaking: changeData.breaking || false,
      migrationGuide: changeData.migrationGuide,
      createdAt: Date.now()
    };

    const versionChanges = this.changelogs.get(changeData.version) || [];
    versionChanges.push(change);
    this.changelogs.set(changeData.version, versionChanges);

    this.emit('apiChangeRecorded', { changeId, version: changeData.version });

    return change;
  }

  /**
   * Get API changelog
   */
  getAPIChangelog(version = null, limit = 50) {
    if (version) {
      return (this.changelogs.get(version) || [])
        .sort((a, b) => b.createdAt - a.createdAt)
        .slice(0, limit);
    }

    // Get all changes across versions
    const allChanges = [];
    for (const changes of this.changelogs.values()) {
      allChanges.push(...changes);
    }

    return allChanges
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, limit);
  }
}

/**
 * Multi-Language SDK System
 */
class MultiLanguageSDKSystem extends EventEmitter {
  constructor() {
    super();
    this.sdks = new Map();
    this.templates = new Map();
    this.generators = new Map();
    this.versions = new Map();
    this.downloads = new Map();
  }

  /**
   * Register SDK
   */
  async registerSDK(sdkData) {
    const sdkId = `SDK_${crypto.randomBytes(8).toString('hex')}`;

    const sdk = {
      id: sdkId,
      name: sdkData.name,
      language: sdkData.language,
      version: sdkData.version || '1.0.0',
      description: sdkData.description,
      features: sdkData.features || [],
      requirements: sdkData.requirements || {},
      installation: sdkData.installation || {},
      documentation: sdkData.documentation,
      repository: sdkData.repository,
      supportedPlatforms: sdkData.supportedPlatforms || [],
      packageName: sdkData.packageName,
      status: 'active',
      downloads: 0,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    this.sdks.set(sdkId, sdk);

    // Track versions
    const languageVersions = this.versions.get(sdk.language) || [];
    languageVersions.push({
      sdkId,
      version: sdk.version,
      releaseDate: sdk.createdAt
    });
    this.versions.set(sdk.language, languageVersions);

    this.emit('sdkRegistered', { sdkId, language: sdk.language });

    return sdk;
  }

  /**
   * Generate SDK for language
   */
  async generateSDK(language, apiSpec, config = {}) {
    const generator = this.generators.get(language);
    if (!generator) {
      throw new Error(`No generator available for language: ${language}`);
    }

    const sdkId = `SDK_${language}_${crypto.randomBytes(8).toString('hex')}`;

    // Generate SDK files
    const generatedFiles = await generator.generate(apiSpec, config);

    const sdk = {
      id: sdkId,
      language,
      version: config.version || '1.0.0',
      files: generatedFiles,
      config,
      generatedAt: Date.now(),
      apiSpecVersion: apiSpec.info?.version || 'v1'
    };

    // Register the generated SDK
    await this.registerSDK({
      name: `Aetheron SDK for ${language}`,
      language,
      version: sdk.version,
      description: `Official Aetheron SDK for ${language}`,
      features: this.extractFeaturesFromSpec(apiSpec),
      requirements: config.requirements || {},
      installation: config.installation || {},
      documentation: `${config.baseUrl}/docs/sdk/${language}`,
      repository: config.repository,
      supportedPlatforms: config.supportedPlatforms || [],
      packageName: config.packageName
    });

    this.emit('sdkGenerated', { sdkId, language });

    return sdk;
  }

  /**
   * Register code generator
   */
  async registerGenerator(language, generator) {
    this.generators.set(language, generator);

    this.emit('generatorRegistered', { language });

    return { language, registered: true };
  }

  /**
   * Download SDK
   */
  async downloadSDK(sdkId, userId = null) {
    const sdk = this.sdks.get(sdkId);
    if (!sdk) throw new Error('SDK not found');

    sdk.downloads++;

    // Track download
    const downloadRecord = {
      sdkId,
      userId,
      language: sdk.language,
      version: sdk.version,
      downloadedAt: Date.now(),
      ipAddress: null // Would be set from request
    };

    const sdkDownloads = this.downloads.get(sdkId) || [];
    sdkDownloads.push(downloadRecord);
    this.downloads.set(sdkId, sdkDownloads);

    this.emit('sdkDownloaded', { sdkId, language: sdk.language, userId });

    return {
      sdkId,
      downloadUrl: this.generateDownloadUrl(sdkId),
      files: sdk.files || []
    };
  }

  /**
   * Generate download URL
   */
  generateDownloadUrl(sdkId) {
    return `https://sdk.aetheron.io/download/${sdkId}`;
  }

  /**
   * Get SDKs by language
   */
  getSDKsByLanguage(language) {
    return Array.from(this.sdks.values())
      .filter(sdk => sdk.language === language && sdk.status === 'active')
      .sort((a, b) => b.createdAt - a.createdAt);
  }

  /**
   * Get all available languages
   */
  getAvailableLanguages() {
    const languages = new Set();

    for (const sdk of this.sdks.values()) {
      if (sdk.status === 'active') {
        languages.add(sdk.language);
      }
    }

    return Array.from(languages).sort();
  }

  /**
   * Get SDK statistics
   */
  getSDKStatistics() {
    const sdks = Array.from(this.sdks.values());
    const activeSDKs = sdks.filter(sdk => sdk.status === 'active');

    const stats = {
      totalSDKs: sdks.length,
      activeSDKs: activeSDKs.length,
      totalDownloads: activeSDKs.reduce((sum, sdk) => sum + sdk.downloads, 0),
      languages: {}
    };

    // Per-language stats
    const languages = this.getAvailableLanguages();
    languages.forEach(language => {
      const languageSDKs = activeSDKs.filter(sdk => sdk.language === language);
      const languageDownloads = languageSDKs.reduce((sum, sdk) => sum + sdk.downloads, 0);

      stats.languages[language] = {
        sdkCount: languageSDKs.length,
        totalDownloads: languageDownloads,
        latestVersion: this.getLatestVersion(language)
      };
    });

    return stats;
  }

  /**
   * Get latest version for language
   */
  getLatestVersion(language) {
    const languageVersions = this.versions.get(language) || [];
    if (languageVersions.length === 0) return null;

    return languageVersions
      .sort((a, b) => this.compareVersions(b.version, a.version))[0]
      .version;
  }

  /**
   * Compare version strings
   */
  compareVersions(version1, version2) {
    const v1Parts = version1.split('.').map(Number);
    const v2Parts = version2.split('.').map(Number);

    for (let i = 0; i < Math.max(v1Parts.length, v2Parts.length); i++) {
      const v1Part = v1Parts[i] || 0;
      const v2Part = v2Parts[i] || 0;

      if (v1Part > v2Part) return 1;
      if (v1Part < v2Part) return -1;
    }

    return 0;
  }

  /**
   * Extract features from API spec
   */
  extractFeaturesFromSpec(apiSpec) {
    const features = new Set();

    // Analyze paths to determine features
    Object.keys(apiSpec.paths || {}).forEach(path => {
      if (path.includes('/wallet')) features.add('Wallet Management');
      if (path.includes('/defi')) features.add('DeFi Integration');
      if (path.includes('/nft')) features.add('NFT Support');
      if (path.includes('/analytics')) features.add('Analytics');
      if (path.includes('/social')) features.add('Social Features');
    });

    return Array.from(features);
  }

  /**
   * Create SDK template
   */
  async createSDKTemplate(language, templateData) {
    const templateId = `TEMPLATE_${language}_${crypto.randomBytes(8).toString('hex')}`;

    const template = {
      id: templateId,
      language,
      name: templateData.name,
      description: templateData.description,
      files: templateData.files || [],
      dependencies: templateData.dependencies || [],
      scripts: templateData.scripts || {},
      config: templateData.config || {},
      createdAt: Date.now()
    };

    this.templates.set(templateId, template);

    return template;
  }

  /**
   * Get SDK templates
   */
  getSDKTemplates(language = null) {
    const templates = Array.from(this.templates.values());

    if (language) {
      return templates.filter(t => t.language === language);
    }

    return templates;
  }

  /**
   * Update SDK version
   */
  async updateSDKVersion(sdkId, newVersion, changes) {
    const sdk = this.sdks.get(sdkId);
    if (!sdk) throw new Error('SDK not found');

    const oldVersion = sdk.version;
    sdk.version = newVersion;
    sdk.updatedAt = Date.now();
    sdk.changelog = sdk.changelog || [];
    sdk.changelog.push({
      version: newVersion,
      changes,
      releaseDate: Date.now()
    });

    // Update versions tracking
    const languageVersions = this.versions.get(sdk.language) || [];
    languageVersions.push({
      sdkId,
      version: newVersion,
      releaseDate: Date.now()
    });
    this.versions.set(sdk.language, languageVersions);

    this.emit('sdkUpdated', { sdkId, oldVersion, newVersion });

    return sdk;
  }
}

module.exports = {
  PluginMarketplaceSystem,
  EnhancedAPIDocumentationSystem,
  MultiLanguageSDKSystem
};
