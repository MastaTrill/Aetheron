// Oracle module for fetching external data
const axios = require('axios');

class Oracle {
  constructor() {
    this.feeds = {}; // feedName => url
    this.values = {}; // feedName => latest value
  }

  registerFeed(name, url) {
    this.feeds[name] = url;
  }

  async updateFeed(name) {
    if (!this.feeds[name]) throw new Error('Feed not registered');
    const res = await axios.get(this.feeds[name]);
    this.values[name] = res.data;
    return this.values[name];
  }

  getValue(name) {
    return this.values[name];
  }
}

module.exports = { Oracle };
