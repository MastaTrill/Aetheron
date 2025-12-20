# Contributing to Aetheron

Thank you for your interest in contributing to Aetheron! This document provides guidelines and instructions for contributing.

## Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Focus on what's best for the community
- Show empathy towards other contributors

## How to Contribute

### Reporting Bugs

1. **Check existing issues** to avoid duplicates
2. **Use the bug report template** when creating an issue
3. **Include details:**
   - Steps to reproduce
   - Expected behavior
   - Actual behavior
   - System information (OS, Node version)
   - Error messages and logs

### Suggesting Features

1. **Check roadmap** and existing feature requests
2. **Describe the feature** clearly
3. **Explain the use case** and benefits
4. **Consider alternatives** you've explored

### Pull Requests

#### Before Submitting

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Follow code style** (run `npm run lint:fix`)
4. **Write tests** for new functionality
5. **Update documentation** as needed
6. **Ensure tests pass** (`npm test`)

#### PR Guidelines

- Use clear, descriptive commit messages
- Reference related issues
- Keep PRs focused (one feature/fix per PR)
- Update CHANGELOG.md
- Add screenshots for UI changes

#### Commit Message Format

```
type(scope): subject

body

footer
```

**Types:**

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting)
- `refactor`: Code refactoring
- `test`: Test additions/changes
- `chore`: Build process or tooling changes

**Example:**

```
feat(defi): add flash loan functionality

Implement flash loan protocol with the following features:
- Instant liquidity borrowing
- Automatic repayment validation
- Fee calculation

Closes #123
```

## Development Setup

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/Aetheron.git
cd Aetheron

# Add upstream remote
git remote add upstream https://github.com/MastaTrill/Aetheron.git

# Install dependencies
npm install --legacy-peer-deps

# Run tests
npm test

# Start development server
npm run dev
```

## Code Style

### JavaScript

- Use ES6+ features
- Follow ESLint rules (`.eslintrc.json`)
- Use Prettier for formatting (`.prettierrc`)
- Add JSDoc comments for functions

**Example:**

```javascript
/**
 * Calculate transaction fee
 * @param {number} amount - Transaction amount
 * @param {number} gasPrice - Current gas price
 * @returns {number} Total fee
 */
function calculateFee(amount, gasPrice) {
  return amount * gasPrice * 0.01;
}
```

### File Organization

```
module-name.js
├── Imports
├── Constants
├── Class/Function Definitions
├── Helper Functions
└── Exports
```

## Testing

### Writing Tests

- Use Jest for unit tests
- Use Playwright for E2E tests
- Aim for 80%+ code coverage
- Test edge cases and error scenarios

**Unit Test Example:**

```javascript
describe('Transaction', () => {
  test('should create valid transaction', () => {
    const tx = new Transaction('0x123', '0x456', 100);
    expect(tx.amount).toBe(100);
    expect(tx.sender).toBe('0x123');
  });

  test('should reject negative amounts', () => {
    expect(() => {
      new Transaction('0x123', '0x456', -10);
    }).toThrow('Invalid amount');
  });
});
```

### Running Tests

```bash
# All tests
npm test

# Unit tests only
npm run test:unit

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e

# Watch mode
npm run test:watch

# Coverage report
npm test -- --coverage
```

## Documentation

### Code Comments

- Document complex logic
- Explain "why" not "what"
- Keep comments up to date

### API Documentation

- Update OpenAPI spec for new endpoints
- Add examples to API_DOCS.md
- Document request/response schemas

### README Updates

- Add new features to README.md
- Update architecture diagrams
- Add usage examples

## Project Structure

```
Aetheron/
├── Core Features         # blockchain.js, smartcontract.js
├── DeFi Modules         # defi.js, dex.js, tokens.js
├── Advanced Features    # account-abstraction.js, zk-privacy.js
├── Security            # security.js, encryption.js
├── Developer Tools     # sdk.js, cli/, graphql-schema.js
├── Frontend            # admin-dashboard.html, explorer.html
├── Mobile             # mobile/ (React Native)
├── Browser Extension  # browser-extension/
├── Tests              # tests/ (Jest, Playwright)
├── Deployment         # deployment/, Dockerfile
└── Documentation      # *.md files
```

## Security

### Reporting Security Issues

**DO NOT** open public issues for security vulnerabilities.

Email: security@aetheron.network

Include:

- Description of vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

### Security Best Practices

- Never commit private keys or secrets
- Use environment variables for sensitive data
- Validate all user inputs
- Use parameterized queries for database operations
- Keep dependencies updated
- Follow OWASP guidelines

## Release Process

1. **Update version** in package.json
2. **Update CHANGELOG.md** with changes
3. **Run full test suite**
4. **Create release branch** (`release/v1.2.0`)
5. **Tag release** (`git tag v1.2.0`)
6. **Push to GitHub**
7. **Create GitHub release** with notes

## Performance Guidelines

- Avoid blocking operations
- Use async/await for I/O operations
- Implement caching where appropriate
- Optimize database queries
- Profile performance-critical code

## Accessibility

- Use semantic HTML
- Provide alt text for images
- Ensure keyboard navigation
- Test with screen readers
- Maintain color contrast ratios

## Browser/Environment Support

- Node.js 18+
- Modern browsers (last 2 versions)
- Chrome/Firefox for browser extension
- iOS 13+, Android 8+ for mobile app

## Getting Help

- 💬 Discord: [Join our community](https://discord.gg/aetheron)
- 📧 Email: dev@aetheron.network
- 📚 Documentation: [docs.aetheron.network](https://docs.aetheron.network)
- 🐛 Issues: [GitHub Issues](https://github.com/MastaTrill/Aetheron/issues)

## Recognition

Contributors will be:

- Listed in CONTRIBUTORS.md
- Mentioned in release notes
- Given credit in commit history

Thank you for contributing to Aetheron! 🚀
