// Decentralized Exchange (DEX) - AMM logic
class DEX {
  constructor() {
    this.pools = {}; // tokenPair => { reserveA, reserveB }
  }

  addLiquidity(tokenA, tokenB, amountA, amountB) {
    const key = `${tokenA}_${tokenB}`;
    if (!this.pools[key]) this.pools[key] = { reserveA: 0, reserveB: 0 };
    this.pools[key].reserveA += amountA;
    this.pools[key].reserveB += amountB;
  }

  swap(tokenA, tokenB, amountA) {
    const key = `${tokenA}_${tokenB}`;
    const pool = this.pools[key];
    // Simple constant product formula
    const amountB = (amountA * pool.reserveB) / (pool.reserveA + amountA);
    pool.reserveA += amountA;
    pool.reserveB -= amountB;
    return amountB;
  }
}

module.exports = { DEX };
