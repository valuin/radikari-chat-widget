# Radikari Chat Widget

A portable, non-invasive RAG chatbot web component for Radikari LMS.

## 🚀 Features

- **Web Component**: Built with LitElement for maximum compatibility
- **TypeScript**: Full type safety and modern development experience
- **Streaming**: Real-time chat responses with Server-Sent Events
- **Responsive**: Works on desktop and mobile devices
- **Themeable**: Customizable CSS properties for branding
- **Lightweight**: ~45KB gzipped, tree-shakable ES modules
- **Framework Agnostic**: Works with React, Vue, Angular, or vanilla JavaScript

## 📦 Installation

### CDN (Recommended)

#### UMD (Recommended for Compatibility)
```html
<script src="https://cdn.jsdelivr.net/npm/radikari-chat-widget@latest/dist/radikari-chat.umd.js"></script>
```

#### ESM (Modern browsers)
```html
<script type="module" src="https://cdn.jsdelivr.net/npm/radikari-chat-widget@latest/dist/radikari-chat.es.js"></script>
```
*Loads Lit as external dependency - automatic in modern browsers*

*Includes Lit bundled - no external dependencies*

### NPM
```bash
npm install radikari-chat-widget
```

### Yarn
```bash
yarn add radikari-chat-widget
```

## 🔧 Quick Start

```html
<!DOCTYPE html>
<html>
<head>
    <!-- Use @latest for latest features or @1.0.1 for stability -->
    <script type="module" src="https://cdn.jsdelivr.net/npm/radikari-chat-widget@latest/dist/radikari-chat.es.js"></script>
</head>
<body>
    <radikari-chat
        tenant-id="YOUR_TENANT_ID"
        api-base-url="https://your-api-domain.com"
        inline>
    </radikari-chat>
</body>
</html>
```

## 📚 Documentation

- [Deployment Guide](./DEPLOYMENT.md) - Production deployment and versioning
- [API Reference](./docs/API.md) - Complete API documentation
- [Examples](./examples/) - Integration examples

## 🎯 Configuration

| Attribute | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `tenant-id` | string | ✅ | - | Your tenant ID |
| `api-base-url` | string | ✅ | - | API base URL |
| `lang` | string | ❌ | `"id"` | Language: `"id"` or `"en"` |
| `inline` | boolean | ❌ | `false` | Display inline or as floating widget |

## 🎨 Theming

```css
radikari-chat {
    --radikari-accent: #667eea;
    --radikari-bg: #ffffff;
    --radikari-text: #1a1a1a;
    --radikari-font: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    --radikari-radius: 12px;
    --radikari-min-height: 500px;
}
```

## 🛠 Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build:prod

# Preview production build
npm run preview
```

## 📱 Browser Support

- Chrome 64+
- Firefox 63+
- Safari 12+
- Edge 79+

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- 📧 Email: support@radikari.com
- 📖 Documentation: [Deployment Guide](./DEPLOYMENT.md)
- 🐛 Issues: [GitHub Issues](https://github.com/radikari/radikari-chat-widget/issues)

## 📈 Version History

See [CHANGELOG.md](CHANGELOG.md) for detailed version history.

---

**Made with ❤️ by Radikari Team**