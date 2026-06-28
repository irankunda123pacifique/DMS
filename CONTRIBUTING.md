# Contributing to DMS

Thank you for your interest in contributing to the Discipline Management System! This document provides guidelines and instructions for contributing.

## Code of Conduct

Be respectful, inclusive, and professional. We're committed to providing a welcoming and inspiring community for all.

## How to Contribute

### Reporting Bugs

Before creating a bug report, check the issue list to ensure it hasn't been reported.

**Submit a bug by:**
1. Use a clear, descriptive title
2. Describe the exact steps to reproduce the problem
3. Provide specific examples to demonstrate the steps
4. Describe the behavior you observed and why it's a problem
5. Include screenshots if possible
6. Include your environment (OS, Node version, etc.)

### Suggesting Enhancements

Enhancements include completely new features and minor improvements.

**Submit an enhancement suggestion by:**
1. Use a clear, descriptive title
2. Provide a step-by-step description of the suggested enhancement
3. Provide specific examples to demonstrate the steps
4. Describe the current behavior vs. expected behavior
5. Explain why this enhancement would be useful

### Pull Requests

**Before You Start:**
- Fork the repository
- Create a branch from `main` for your feature
- Follow the code style and conventions
- Add tests for new functionality
- Update documentation

**Process:**
1. Create a feature branch: `git checkout -b feature/amazing-feature`
2. Make your changes
3. Commit with clear messages: `git commit -m 'Add amazing feature'`
4. Push to your fork: `git push origin feature/amazing-feature`
5. Submit a Pull Request

**PR Requirements:**
- Clear description of changes
- Link to related issues
- Pass all tests
- No breaking changes without discussion
- Updated documentation if applicable

## Development Setup

### 1. Clone Repository
```bash
git clone https://github.com/yourusername/dms.git
cd dms
```

### 2. Install Dependencies
```bash
cd server
npm install
```

### 3. Setup Local Database
```bash
# Create database
mysql -u root -p

# In MySQL:
CREATE DATABASE dms;
USE dms;
SOURCE setup.sql;
```

### 4. Configure Environment
```bash
cp .env.example .env
# Edit .env with your local settings
```

### 5. Seed Database
```bash
npm run seed
```

### 6. Start Development Server
```bash
npm run dev
```

## Code Style

### JavaScript/Node.js

**Use:**
- 4 spaces for indentation
- Semicolons at end of statements
- camelCase for variables and functions
- PascalCase for classes and constructors
- UPPER_CASE for constants

**Example:**
```javascript
const myConstant = 42;

function myFunction(parameter) {
    const localVariable = 'value';
    return localVariable;
}

class MyClass {
    constructor() {
        this.property = null;
    }
}
```

**ESLint Configuration** (.eslintrc.json):
```json
{
  "env": {
    "node": true,
    "es2021": true
  },
  "extends": "eslint:recommended",
  "parserOptions": {
    "ecmaVersion": "latest"
  },
  "rules": {
    "indent": ["error", 4],
    "quotes": ["error", "single"],
    "semi": ["error", "always"],
    "no-unused-vars": "warn"
  }
}
```

### Comments
```javascript
// Single line comments for brief explanations

/**
 * Multi-line comments for complex logic
 * Explain the why, not the what
 */

// TODO: Fix this later
// FIXME: Known issue with...
```

### Error Handling
```javascript
// Good
try {
    const result = await operation();
    return result;
} catch (error) {
    logger.error('Operation failed:', error);
    throw new Error('Operation failed');
}

// Bad
try {
    const result = await operation();
} catch (error) {
    console.log(error);
}
```

## Git Commit Messages

**Format:**
```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation changes
- `style`: Code style changes (no logic changes)
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples:**
```
feat(auth): add JWT token verification

fix(students): correct discipline marks calculation

docs(api): update authentication endpoints

refactor(routes): simplify error handling
```

**Commit Message Best Practices:**
- Use imperative mood ("add feature" not "added feature")
- Don't capitalize the subject line
- Don't end with a period
- Limit to 50 characters for subject
- Wrap body at 72 characters
- Reference issues: `closes #42`

## Testing

### Write Tests For:
- New features
- Bug fixes
- Security changes
- API endpoints

### Test File Naming
```
<module>.test.js
```

### Example Test
```javascript
const assert = require('assert');
const { myFunction } = require('./myModule');

describe('myFunction', () => {
    it('should return expected value', () => {
        const result = myFunction('input');
        assert.strictEqual(result, 'expected');
    });

    it('should handle errors', () => {
        assert.throws(() => {
            myFunction(null);
        }, Error);
    });
});
```

### Run Tests
```bash
npm test
```

## Documentation

### Update Documentation For:
- New features
- API changes
- Configuration changes
- Setup procedures

### Files to Update:
- `README.md` - General overview
- `API.md` - API endpoints
- `DEPLOYMENT.md` - Deployment steps
- Code comments - Complex logic

**Documentation Standards:**
- Use clear, simple language
- Include examples
- Keep links current
- Update table of contents
- Fix typos and grammar

## Pull Request Process

1. **Before Submitting:**
   - Test your changes thoroughly
   - Run `npm run dev` without errors
   - Follow code style guidelines
   - Update documentation
   - Ensure git history is clean

2. **Submitting:**
   - Create descriptive PR title
   - Fill out PR template completely
   - Link related issues
   - Request reviewers

3. **After Submission:**
   - Respond to review feedback
   - Update code as suggested
   - Don't force-push after review started
   - Squash commits if requested

## Review Process

### Reviewers Will Check:
- Code quality and style
- Security implications
- Performance impact
- Test coverage
- Documentation accuracy
- Breaking changes

### Approval Requires:
- At least 1 approval from maintainer
- All tests passing
- No conflicts with main branch
- Updated documentation

## License

By contributing, you agree your code will be licensed under the same license as the project.

## Questions?

Open an issue or email the maintainers.

---

**Thank you for contributing to DMS!**
