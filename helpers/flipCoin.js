module.exports = flipCoin = () => {
  return Math.floor(Math.random() * 2) === 1 ? "HEAD" : "TAIL";
};