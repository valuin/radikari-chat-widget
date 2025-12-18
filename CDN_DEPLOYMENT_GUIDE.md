# CDN Deployment Guide for Radikari Chat Widget

## Quick Start: Deploy to npm (Recommended)

Since your package.json is already configured for npm publishing, this is the easiest way to get CDN distribution:

### Step 1: Publish to npm
```bash
# Login to npm (one-time setup)
npm login

# Publish the package
npm publish
```

### Step 2: Access via CDN
Once published, your widget is immediately available via:

**jsDelivr (Recommended):**
```html
<!-- ESM Version -->
<script type="module" src="https://cdn.jsdelivr.net/npm/radikari-chat-widget@1.0.0/dist/radikari-chat.es.js"></script>

<!-- UMD Version -->
<script src="https://cdn.jsdelivr.net/npm/radikari-chat-widget@1.0.0/dist/radikari-chat.umd.js"></script>
```

**unpkg:**
```html
<!-- ESM Version -->
<script type="module" src="https://unpkg.com/radikari-chat-widget@1.0.0/dist/radikari-chat.es.js"></script>

<!-- UMD Version -->
<script src="https://unpkg.com/radikari-chat-widget@1.0.0/dist/radikari-chat.umd.js"></script>
```

## Alternative: GitHub Pages (Free Hosting)

If you prefer not to publish to npm:

### Step 1: Create GitHub Repository
```bash
git init
git add .
git commit -m "Initial release v1.0.0"
git branch -M main
git remote add origin https://github.com/yourusername/radikari-chat-widget.git
git push -u origin main
```

### Step 2: Enable GitHub Pages
1. Go to your repository on GitHub
2. Click Settings → Pages
3. Source: Deploy from a branch
4. Branch: main, folder: /root
5. Click Save

### Step 3: Access via GitHub Pages CDN
```html
<!-- ESM Version -->
<script type="module" src="https://yourusername.github.io/radikari-chat-widget/dist/radikari-chat.es.js"></script>

<!-- UMD Version -->
<script src="https://yourusername.github.io/radikari-chat-widget/dist/radikari-chat.umd.js"></script>
```

## Alternative: Self-Hosted CDN

### Step 1: Upload Files to Your Server
Upload the `dist/` folder to your web server:

```
your-server.com/
├── radikari-chat-widget/
│   ├── dist/
│   │   ├── radikari-chat.es.js
│   │   ├── radikari-chat.umd.js
│   │   └── radikari-chat.umd.js.map
```

### Step 2: Access via Your CDN
```html
<!-- ESM Version -->
<script type="module" src="https://your-server.com/radikari-chat-widget/dist/radikari-chat.es.js"></script>

<!-- UMD Version -->
<script src="https://your-server.com/radikari-chat-widget/dist/radikari-chat.umd.js"></script>
```

## Alternative: Cloudflare Pages (Free Hosting)

### Step 1: Deploy to Cloudflare Pages
```bash
# Install Wrangler CLI
npm install -g wrangler

# Login to Cloudflare
wrangler login

# Deploy
wrangler pages deploy dist --project-name radikari-chat-widget
```

### Step 2: Access via Cloudflare Pages
```html
<!-- ESM Version -->
<script type="module" src="https://radikari-chat-widget.pages.dev/dist/radikari-chat.es.js"></script>

<!-- UMD Version -->
<script src="https://radikari-chat-widget.pages.dev/dist/radikari-chat.umd.js"></script>
```

## Version Management

### Updating Versions
```bash
# Patch version (1.0.0 → 1.0.1)
npm run release:patch

# Minor version (1.0.0 → 1.1.0)
npm run release:minor

# Major version (1.0.0 → 2.0.0)
npm run release:major

# Publish new version
npm publish
```

### Using Specific Versions
```html
<!-- Latest version -->
<script src="https://cdn.jsdelivr.net/npm/radikari-chat-widget/dist/radikari-chat.umd.js"></script>

<!-- Specific version -->
<script src="https://cdn.jsdelivr.net/npm/radikari-chat-widget@1.0.0/dist/radikari-chat.umd.js"></script>

<!-- Latest patch of version 1.0.x -->
<script src="https://cdn.jsdelivr.net/npm/radikari-chat-widget@1.0/dist/radikari-chat.umd.js"></script>
```

## Integration Examples

### Basic Integration
```html
<!DOCTYPE html>
<html>
<head>
    <title>Radikari Chat Widget</title>
</head>
<body>
    <radikari-chat
        tenant-id="YOUR_TENANT_ID"
        api-base-url="https://your-api.com"
        inline
    ></radikari-chat>

    <!-- Load the widget -->
    <script src="https://cdn.jsdelivr.net/npm/radikari-chat-widget@1.0.0/dist/radikari-chat.umd.js"></script>
</body>
</html>
```

### Advanced Integration with Error Handling
```html
<!DOCTYPE html>
<html>
<head>
    <title>Radikari Chat Widget</title>
    <style>
        .chat-container {
            min-height: 500px;
            border: 1px solid #eee;
            border-radius: 12px;
            overflow: hidden;
        }
        .chat-error {
            padding: 20px;
            background: #fff3cd;
            border: 1px solid #ffeaa7;
            border-radius: 8px;
            color: #856404;
            text-align: center;
        }
    </style>
</head>
<body>
    <div class="chat-container">
        <div id="chat-error" class="chat-error" style="display: none;">
            Failed to load chat widget. Please refresh the page.
        </div>
        <radikari-chat
            id="chat-widget"
            tenant-id="YOUR_TENANT_ID"
            api-base-url="https://your-api.com"
            inline
        ></radikari-chat>
    </div>

    <script>
        // Load widget with error handling
        function loadWidget() {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/radikari-chat-widget@1.0.0/dist/radikari-chat.umd.js';
            script.onload = function() {
                console.log('Radikari Chat Widget loaded successfully');
            };
            script.onerror = function() {
                console.error('Failed to load Radikari Chat Widget');
                document.getElementById('chat-error').style.display = 'block';
                document.getElementById('chat-widget').style.display = 'none';
            };
            document.head.appendChild(script);
        }

        // Load widget after page load
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', loadWidget);
        } else {
            loadWidget();
        }
    </script>
</body>
</html>
```

## Performance Optimization

### Preload Critical Resources
```html
<head>
    <!-- Preload widget for faster loading -->
    <link rel="preload" href="https://cdn.jsdelivr.net/npm/radikari-chat-widget@1.0.0/dist/radikari-chat.umd.js" as="script">
</head>
```

### Use Subresource Integrity (SRI)
```html
<script src="https://cdn.jsdelivr.net/npm/radikari-chat-widget@1.0.0/dist/radikari-chat.umd.js"
        integrity="sha384-YOUR_SRI_HASH"
        crossorigin="anonymous"></script>
```

## CDN Comparison

| CDN | Speed | Reliability | Features | Cost |
|-----|-------|-------------|----------|------|
| jsDelivr | Excellent | Excellent | Auto-minification, multiple CDNs | Free |
| unpkg | Good | Excellent | Simple, npm-based | Free |
| GitHub Pages | Good | Good | Git integration | Free |
| Cloudflare Pages | Excellent | Excellent | Global CDN, analytics | Free tier |

## Troubleshooting

### Common Issues

1. **Widget not loading**: Check browser console for errors
2. **CORS issues**: Ensure CDN allows cross-origin requests
3. **Version conflicts**: Use specific version instead of @latest
4. **Network errors**: Try different CDN or add fallback

### Debug Mode
```html
<script>
// Enable debug mode
window.RADIKARI_DEBUG = true;
</script>
<script src="https://cdn.jsdelivr.net/npm/radikari-chat-widget@1.0.0/dist/radikari-chat.umd.js"></script>
```

## Next Steps

1. Choose your deployment method (npm recommended)
2. Deploy the widget
3. Test integration in your application
4. Monitor performance and usage
5. Update versions as needed

For support, check the browser console and refer to the DEPLOYMENT.md file for detailed configuration options.