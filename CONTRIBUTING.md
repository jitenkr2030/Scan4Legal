# Contributing to Scan4Legal

Thank you for your interest in contributing to Scan4Legal! This document provides guidelines for contributors.

## 🎯 Our Mission

Scan4Legal aims to make legal assistance accessible to every citizen through technology. We believe in justice for all, regardless of their economic status or location.

## 🤝 How to Contribute

### Reporting Bugs

If you find a bug, please create an issue on GitHub with:
- Clear description of the problem
- Steps to reproduce
- Expected vs actual behavior
- Environment details (browser, OS, etc.)

### Suggesting Features

We welcome feature suggestions! Please:
- Check existing issues first
- Provide clear use cases
- Explain why it would help users

### Code Contributions

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Make your changes**
4. **Add tests** if applicable
5. **Commit your changes**: `git commit -m 'Add amazing feature'`
6. **Push to the branch**: `git push origin feature/amazing-feature`
7. **Open a Pull Request**

## 📝 Development Guidelines

### Code Style

- Use TypeScript for all new code
- Follow ESLint configuration
- Use semantic HTML5
- Mobile-first responsive design
- Accessibility compliance (WCAG 2.1 AA)

### Component Guidelines

- Use shadcn/ui components when possible
- Follow React best practices
- Include proper TypeScript types
- Add accessibility attributes

### Multi-language Support

- All user-facing text must support multiple languages
- Use the `useLanguage` hook for translations
- Test with different languages
- Consider RTL languages for future

## 🌍 Localization

We support multiple Indian languages. When adding new features:

1. Add translation keys to `src/hooks/use-language.ts`
2. Test with all supported languages
3. Consider cultural context
4. Use simple, clear language

## 🧪 Testing

- Test on mobile devices
- Check accessibility
- Verify multi-language functionality
- Test emergency features
- Check WebSocket connectivity

## 📱 Mobile Considerations

- Design for slow networks
- Optimize images and assets
- Test on various screen sizes
- Consider touch interactions
- Ensure voice input works

## 🔒 Security

- Never commit sensitive data
- Follow OWASP guidelines
- Validate all inputs
- Use HTTPS in production
- Protect user privacy

## 📖 Documentation

- Update README for major features
- Comment complex logic
- Document API endpoints
- Include deployment instructions

## 🚀 Deployment

- Test in staging first
- Follow semantic versioning
- Update changelog
- Monitor after deployment

## 💬 Communication

- Be respectful and inclusive
- Help others learn
- Share knowledge
- Ask questions if unsure

## 📋 Code Review Process

1. Automated checks (lint, tests)
2. Manual code review
3. Accessibility review
4. Mobile testing
5. Language testing

## 🏷️ Labeling Issues

- `bug`: Bug reports
- `enhancement`: Feature requests
- `accessibility`: A11y issues
- `mobile`: Mobile-specific issues
- `i18n`: Internationalization
- `security`: Security issues
- `documentation`: Docs updates

## 🎉 Recognition

Contributors are recognized in:
- README contributors section
- Release notes
- Team communications

Thank you for helping make legal assistance accessible to everyone! 🙏

---

If you have questions, feel free to:
- Open an issue for discussion
- Start a discussion in GitHub
- Email: support@scan4legal.com