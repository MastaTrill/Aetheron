// Decentralized Social Network
class SocialNetwork {
  constructor() {
    this.posts = [];
    this.profiles = {};
    this.follows = {};
  }

  createProfile(address, data) {
    this.profiles[address] = data;
  }

  post(address, content) {
    this.posts.push({ address, content, timestamp: Date.now() });
  }

  follow(follower, followee) {
    if (!this.follows[follower]) this.follows[follower] = new Set();
    this.follows[follower].add(followee);
  }
}

module.exports = { SocialNetwork };
