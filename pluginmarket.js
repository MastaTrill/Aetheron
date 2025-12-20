// Plugin/Module Marketplace
class PluginMarket {
  constructor() {
    this.plugins = [];
  }

  publishPlugin(author, name, description) {
    this.plugins.push({ author, name, description, timestamp: Date.now() });
  }

  listPlugins() {
    return this.plugins;
  }
}

module.exports = { PluginMarket };
