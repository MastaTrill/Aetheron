/**
 * OpenAPI/Swagger Specification Generator
 * Auto-generate interactive API documentation
 */

/**
 * OpenAPI Spec Builder
 * Build OpenAPI 3.0 specification
 */
class OpenAPIBuilder {
  constructor(title, version, description) {
    this.spec = {
      openapi: '3.0.0',
      info: {
        title,
        version,
        description,
        contact: {
          name: 'Aetheron API Support',
          email: 'api@aetheron.network',
          url: 'https://aetheron.network'
        },
        license: {
          name: 'MIT',
          url: 'https://opensource.org/licenses/MIT'
        }
      },
      servers: [
        {
          url: 'http://localhost:3001',
          description: 'Development server'
        },
        {
          url: 'https://api.aetheron.network',
          description: 'Production server'
        }
      ],
      paths: {},
      components: {
        schemas: {},
        securitySchemes: {
          ApiKeyAuth: {
            type: 'apiKey',
            in: 'header',
            name: 'X-API-Key'
          },
          BasicAuth: {
            type: 'http',
            scheme: 'basic'
          },
          BearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT'
          }
        },
        responses: {},
        parameters: {},
        examples: {}
      },
      tags: []
    };
  }

  /**
   * Add tag
   */
  addTag(name, description) {
    this.spec.tags.push({ name, description });
    return this;
  }

  /**
   * Add schema
   */
  addSchema(name, schema) {
    this.spec.components.schemas[name] = schema;
    return this;
  }

  /**
   * Add path
   */
  addPath(path, method, operation) {
    if (!this.spec.paths[path]) {
      this.spec.paths[path] = {};
    }
    this.spec.paths[path][method.toLowerCase()] = operation;
    return this;
  }

  /**
   * Build spec
   */
  build() {
    return this.spec;
  }

  /**
   * Export as JSON
   */
  toJSON() {
    return JSON.stringify(this.spec, null, 2);
  }
}

/**
 * Generate Aetheron API OpenAPI Spec
 */
function generateAetheronAPISpec() {
  const builder = new OpenAPIBuilder(
    'Aetheron Blockchain API',
    '1.0.0',
    'RESTful API for interacting with the Aetheron blockchain platform'
  );

  // Tags
  builder
    .addTag('Blockchain', 'Blockchain and block operations')
    .addTag('Transactions', 'Transaction management')
    .addTag('Wallets', 'Wallet and balance operations')
    .addTag('Smart Contracts', 'Smart contract deployment and interaction')
    .addTag('DeFi', 'Decentralized finance operations')
    .addTag('NFT', 'NFT minting and marketplace')
    .addTag('DAO', 'Decentralized governance')
    .addTag('Multi-Chain', 'Cross-chain operations')
    .addTag('Account Abstraction', 'Smart accounts and gasless transactions')
    .addTag('Privacy', 'Zero-knowledge privacy features')
    .addTag('Fiat Gateway', 'Fiat on/off-ramp');

  // Schemas
  builder
    .addSchema('Block', {
      type: 'object',
      properties: {
        index: { type: 'integer', example: 123 },
        hash: { type: 'string', example: '0xabc123...' },
        previousHash: { type: 'string' },
        timestamp: { type: 'integer' },
        miner: { type: 'string' },
        transactions: {
          type: 'array',
          items: { $ref: '#/components/schemas/Transaction' }
        },
        nonce: { type: 'integer' }
      }
    })
    .addSchema('Transaction', {
      type: 'object',
      properties: {
        hash: { type: 'string', example: '0xdef456...' },
        sender: { type: 'string', example: '0x123...' },
        receiver: { type: 'string', example: '0x456...' },
        amount: { type: 'number', example: 100 },
        timestamp: { type: 'integer' },
        signature: { type: 'string' },
        status: { type: 'string', enum: ['pending', 'confirmed', 'failed'] }
      }
    })
    .addSchema('Wallet', {
      type: 'object',
      properties: {
        address: { type: 'string', example: '0x789...' },
        publicKey: { type: 'string' },
        balance: { type: 'number', example: 1000 }
      }
    })
    .addSchema('Error', {
      type: 'object',
      properties: {
        error: { type: 'string' },
        code: { type: 'string' },
        timestamp: { type: 'integer' }
      }
    });

  // Blockchain endpoints
  builder.addPath('/api', 'get', {
    tags: ['Blockchain'],
    summary: 'Get API status',
    description: 'Check if the API is online and get version information',
    responses: {
      200: {
        description: 'API is online',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                status: { type: 'string', example: 'online' },
                version: { type: 'string', example: '1.0.0' },
                timestamp: { type: 'integer' }
              }
            }
          }
        }
      }
    }
  });

  builder.addPath('/api/blockchain', 'get', {
    tags: ['Blockchain'],
    summary: 'Get entire blockchain',
    description: 'Retrieve all blocks in the blockchain',
    responses: {
      200: {
        description: 'Blockchain data',
        content: {
          'application/json': {
            schema: {
              type: 'array',
              items: { $ref: '#/components/schemas/Block' }
            }
          }
        }
      }
    }
  });

  builder.addPath('/api/block/{index}', 'get', {
    tags: ['Blockchain'],
    summary: 'Get block by index',
    parameters: [
      {
        name: 'index',
        in: 'path',
        required: true,
        schema: { type: 'integer' },
        description: 'Block index'
      }
    ],
    responses: {
      200: {
        description: 'Block data',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Block' }
          }
        }
      },
      404: {
        description: 'Block not found',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Error' }
          }
        }
      }
    }
  });

  // Transaction endpoints
  builder.addPath('/api/transaction', 'post', {
    tags: ['Transactions'],
    summary: 'Create new transaction',
    description: 'Create and broadcast a new transaction',
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['from', 'to', 'amount', 'privateKey'],
            properties: {
              from: { type: 'string', example: '0x123...' },
              to: { type: 'string', example: '0x456...' },
              amount: { type: 'number', example: 100 },
              privateKey: { type: 'string' }
            }
          },
          examples: {
            'simple-transfer': {
              summary: 'Simple token transfer',
              value: {
                from: '0x1234567890abcdef',
                to: '0xfedcba0987654321',
                amount: 100,
                privateKey: 'your-private-key'
              }
            }
          }
        }
      }
    },
    responses: {
      201: {
        description: 'Transaction created',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Transaction' }
          }
        }
      },
      400: {
        description: 'Invalid request',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Error' }
          }
        }
      }
    }
  });

  builder.addPath('/api/transaction/{hash}', 'get', {
    tags: ['Transactions'],
    summary: 'Get transaction by hash',
    parameters: [
      {
        name: 'hash',
        in: 'path',
        required: true,
        schema: { type: 'string' },
        description: 'Transaction hash'
      }
    ],
    responses: {
      200: {
        description: 'Transaction data',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Transaction' }
          }
        }
      },
      404: {
        description: 'Transaction not found',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Error' }
          }
        }
      }
    }
  });

  // Wallet endpoints
  builder.addPath('/api/balance/{address}', 'get', {
    tags: ['Wallets'],
    summary: 'Get address balance',
    parameters: [
      {
        name: 'address',
        in: 'path',
        required: true,
        schema: { type: 'string' },
        description: 'Wallet address'
      }
    ],
    responses: {
      200: {
        description: 'Address balance',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                address: { type: 'string' },
                balance: { type: 'number' }
              }
            }
          }
        }
      }
    }
  });

  // Mining endpoint
  builder.addPath('/api/mine', 'post', {
    tags: ['Blockchain'],
    summary: 'Mine a new block',
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              minerAddress: { type: 'string', example: '0x123...' }
            }
          }
        }
      }
    },
    responses: {
      201: {
        description: 'Block mined successfully',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Block' }
          }
        }
      }
    }
  });

  // Multi-chain endpoints
  builder.addPath('/multichain/chains', 'get', {
    tags: ['Multi-Chain'],
    summary: 'List all supported chains',
    responses: {
      200: {
        description: 'List of supported chains',
        content: {
          'application/json': {
            schema: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string', example: 'ethereum' },
                  chainId: { type: 'integer', example: 1 },
                  rpcUrl: { type: 'string' },
                  explorerUrl: { type: 'string' }
                }
              }
            }
          }
        }
      }
    }
  });

  builder.addPath('/multichain/balance/{chain}/{address}', 'get', {
    tags: ['Multi-Chain'],
    summary: 'Get balance on specific chain',
    parameters: [
      {
        name: 'chain',
        in: 'path',
        required: true,
        schema: { type: 'string', enum: ['ethereum', 'base', 'polygon', 'solana'] },
        description: 'Chain name'
      },
      {
        name: 'address',
        in: 'path',
        required: true,
        schema: { type: 'string' },
        description: 'Wallet address'
      }
    ],
    responses: {
      200: {
        description: 'Balance on chain',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                chain: { type: 'string' },
                address: { type: 'string' },
                balance: { type: 'string' }
              }
            }
          }
        }
      }
    }
  });

  return builder.build();
}

/**
 * Generate HTML documentation
 */
function generateHTMLDocs(spec) {
  return `<!DOCTYPE html>
<html>
<head>
  <title>${spec.info.title} - API Documentation</title>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="stylesheet" type="text/css" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css">
  <style>
    body { margin: 0; padding: 0; }
  </style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
  <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-standalone-preset.js"></script>
  <script>
    window.onload = function() {
      const ui = SwaggerUIBundle({
        spec: ${JSON.stringify(spec)},
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIStandalonePreset
        ],
        plugins: [
          SwaggerUIBundle.plugins.DownloadUrl
        ],
        layout: "StandaloneLayout"
      });
      window.ui = ui;
    };
  </script>
</body>
</html>`;
}

/**
 * Generate Postman Collection
 */
function generatePostmanCollection(spec) {
  const collection = {
    info: {
      name: spec.info.title,
      description: spec.info.description,
      schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json'
    },
    item: []
  };

  for (const [path, methods] of Object.entries(spec.paths)) {
    for (const [method, operation] of Object.entries(methods)) {
      const item = {
        name: operation.summary,
        request: {
          method: method.toUpperCase(),
          header: [],
          url: {
            raw: `{{baseUrl}}${path}`,
            host: ['{{baseUrl}}'],
            path: path.split('/').filter((p) => p)
          }
        }
      };

      if (operation.requestBody) {
        item.request.header.push({
          key: 'Content-Type',
          value: 'application/json'
        });

        const example = Object.values(
          operation.requestBody.content['application/json'].examples || {}
        )[0];
        if (example) {
          item.request.body = {
            mode: 'raw',
            raw: JSON.stringify(example.value, null, 2)
          };
        }
      }

      collection.item.push(item);
    }
  }

  return collection;
}

module.exports = {
  OpenAPIBuilder,
  generateAetheronAPISpec,
  generateHTMLDocs,
  generatePostmanCollection
};
