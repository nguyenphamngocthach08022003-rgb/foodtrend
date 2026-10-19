// FT + year + 4 random digits, checked for uniqueness by caller
function generateOrderCode() {
  const year = new Date().getFullYear();
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `FT${year}${rand}`;
}

module.exports = generateOrderCode;
