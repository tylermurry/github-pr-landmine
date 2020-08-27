module.exports = {
  transform: {
    '.+\\.(ts|tsx|js|jsx)$': 'ts-jest',
  },
  testPathIgnorePatterns: ['\\.js', '/__mock__/']
};
