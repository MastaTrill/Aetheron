// Gaming Platform
class GamePlatform {
  constructor() {
    this.assets = {}; // address => [asset]
    this.leaderboard = [];
  }

  addAsset(address, asset) {
    if (!this.assets[address]) this.assets[address] = [];
    this.assets[address].push(asset);
  }

  updateLeaderboard(address, score) {
    this.leaderboard.push({ address, score });
    this.leaderboard.sort((a, b) => b.score - a.score);
  }
}

module.exports = { GamePlatform };
