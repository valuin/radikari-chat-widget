# Radikari Chat Widget - Deployment Guide

## Overview

The Radikari Chat Widget is a production-ready web component that can be easily integrated into any website. This guide covers deployment, versioning, and integration best practices.

## Versioning

We use semantic versioning (SemVer) for releases:
- **Major (X.0.0)**: Breaking changes
- **Minor (X.Y.0)**: New features, backward compatible
- **Patch (X.Y.Z)**: Bug fixes, backward compatible

Current version: `1.0.0`

## Build Process

### Development
```bash
npm run dev
```

### Production Build
```bash
# Build both ES modules and UMD versions
npm run build:prod

# Or build separately
npm run build:es       # ES modules
npm run build:umd      # UMD for legacy browsers
```

**Note**: The build process uses Terser for minification. It's included as a dev dependency, but if you encounter build errors, ensure it's installed:
```bash
npm install --save-dev terser
```

### Build Outputs
- `dist/radikari-chat.es.js` - ES modules (modern browsers)
- `dist/radikari-chat.es.js.map` - Source map
- `dist/radikari-chat.umd.js` - UMD bundle (legacy support)
- `dist/radikari-chat.umd.js.map` - Source map

## Deployment Options

### Option 1: CDN (Recommended)

#### ESM (Modern browsers - Recommended)
```html
<script type="module" src="https://cdn.jsdelivr.net/npm/radikari-chat-widget@1.0.0/dist/radikari-chat.es.js"></script>
```
**⚠️ Important:** ESM build loads Lit as an external dependency. Modern browsers will handle this automatically.

#### UMD (Legacy browsers - All-in-one)
```html
<script src="https://cdn.jsdelivr.net/npm/radikari-chat-widget@1.0.0/dist/radikari-chat.umd.js"></script>
```
**✅ Safe:** UMD build includes Lit bundled - no external dependencies needed.

#### UMD with External Lit (Optimized)
```html
<!-- Load Lit first -->
<script src="https://unpkg.com/lit@3/index.js"></script>
<!-- Then load the widget -->
<script src="https://cdn.jsdelivr.net/npm/radikari-chat-widget@1.0.0/dist/radikari-chat.umd.js"></script>
```
**💡 Optimized:** Smaller widget size but requires Lit to be loaded first.

#### unpkg (Alternative CDN)
```html
<!-- ESM -->
<script type="module" src="https://unpkg.com/radikari-chat-widget@1.0.0/dist/radikari-chat.es.js"></script>

<!-- UMD -->
<script src="https://unpkg.com/radikari-chat-widget@1.0.0/dist/radikari-chat.umd.js"></script>
```

### Option 2: Self-Hosted

1. Upload `dist/` folder to your web server
2. Serve the files with proper MIME types
3. Update the script src path in your HTML

```html
<script type="module" src="/assets/radikari-chat-widget/radikari-chat.es.js"></script>
```

### Option 3: Package Managers

#### NPM
```bash
npm install radikari-chat-widget@1.0.0
```

#### Yarn
```bash
yarn add radikari-chat-widget@1.0.0
```

## Integration Guide

### Basic Integration

```html
<!DOCTYPE html>
<html>
<head>
    <title>Your Website</title>
    <script type="module" src="https://cdn.jsdelivr.net/npm/radikari-chat-widget@1.0.0/dist/radikari-chat.es.js"></script>
</head>
<body>
    <!-- Your content -->
    
    <!-- Chat Widget -->
    <radikari-chat
        tenant-id="YOUR_TENANT_ID"
        api-base-url="https://your-api-domain.com"
        inline>
    </radikari-chat>
</body>
</html>
```

### Configuration Options

| Attribute | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `tenant-id` | string | ✅ | - | Your tenant ID |
| `lang` | string | ❌ | `"id"` | Language: `"id"` or `"en"` |
| `inline` | boolean | ❌ | `false` | Display inline or as floating widget |

### Floating Widget (Default)

```html
<radikari-chat
    tenant-id="YOUR_TENANT_ID"
    api-base-url="https://your-api-domain.com">
</radikari-chat>
```

### Inline Widget

```html
<radikari-chat
    tenant-id="YOUR_TENANT_ID"
    api-base-url="https://your-api-domain.com"
    inline>
</radikari-chat>
```

### Styling

The widget uses CSS custom properties for theming:

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

## Release Process

### Automated Release
```bash
# Patch release (1.0.0 → 1.0.1)
npm version patch

# Minor release (1.0.0 → 1.1.0)
npm version minor

# Major release (1.0.0 → 2.0.0)
npm version major

# Publish to NPM
npm run release
```

### Manual Release Steps

1. Update version in `package.json`
2. Update changelog
3. Create git tag
4. Build production files
5. Publish to NPM
6. Update CDN documentation

## Environment Variables

For development, you can configure these in `.env`:

```env
VITE_TENANT_ID=your_tenant_id
VITE_API_BASE_URL=https://your-api-domain.com
VITE_DEFAULT_LANG=id
```

## Browser Support

- Chrome 64+
- Firefox 63+
- Safari 12+
- Edge 79+

Legacy browser support provided via UMD bundle.

## Performance Optimization

### Tree Shaking
The ES module build supports tree shaking. Bundle size: ~45KB gzipped.

### Loading Strategy
```html
<!-- Preload for better performance -->
<link rel="modulepreload" href="https://cdn.jsdelivr.net/npm/radikari-chat-widget@1.0.0/dist/radikari-chat.es.js">

<!-- Async loading -->
<script type="module" async src="https://cdn.jsdelivr.net/npm/radikari-chat-widget@1.0.0/dist/radikari-chat.es.js"></script>
```

## Security Considerations

1. **CORS**: Ensure your API allows the widget's origin
2. **Tenant Isolation**: Each tenant has isolated chat threads
3. **Input Validation**: All inputs are validated on the backend
4. **HTTPS**: Always serve the widget over HTTPS in production

## Monitoring and Analytics

The widget includes built-in error logging and performance monitoring. Configure your backend to track:

- Thread creation events
- Message sending/receiving
- Error rates
- Performance metrics

## Troubleshooting

### Common Issues

1. **Widget not loading**: Check browser console for errors
2. **CORS errors**: Verify API CORS configuration
3. **Tenant not found**: Ensure tenant ID is correct
4. **Streaming not working**: Check API endpoint accessibility

### Debug Mode

Enable debug logging by setting `localStorage.debug = 'radikari:*'` in browser console.

## Support

For deployment issues:
1. Check this documentation
2. Review browser console errors
3. Verify API connectivity
4. Contact support at support@radikari.com

## Changelog

### v1.0.0 (2025-12-18)
- Initial production release
- ES modules and UMD bundles
- Semantic versioning implemented
- CDN deployment support
- Comprehensive documentation