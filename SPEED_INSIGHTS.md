# Vercel Speed Insights Integration

This project has been configured with Vercel Speed Insights to automatically track web vitals and performance metrics.

## What Was Installed

- **Package**: `@vercel/speed-insights@1.3.1`
- **Integration Type**: Vanilla JavaScript (bundled)
- **Files Modified**: All HTML pages (index.html, about.html, services.html, contact.html, success.html)

## How It Works

1. The `speed-insights.js` file imports and initializes the Speed Insights tracking
2. The `speed-insights.bundle.js` file is the bundled version that loads in the browser
3. The script is included in all HTML pages via a deferred script tag
4. Performance metrics are automatically collected and sent to Vercel

## Configuration

The Speed Insights is configured with:
- **Debug Mode**: Disabled in production
- **Sample Rate**: 100% (all page views are tracked)

You can modify these settings in `speed-insights.js` if needed.

## Building

To rebuild the Speed Insights bundle after making changes:

```bash
npm run build
```

## Enabling in Vercel Dashboard

To see the Speed Insights data:

1. Log in to your Vercel Dashboard
2. Navigate to your project
3. Go to the "Speed Insights" tab in the sidebar
4. Click "Enable" if not already enabled
5. Deploy your site to start collecting data

## Notes

- Speed Insights does NOT track data in development mode
- Data will only appear after deploying to Vercel
- Metrics are collected for all page views automatically
- The tracking script is loaded asynchronously and won't affect page load performance

## Documentation

For more information, visit:
- [Vercel Speed Insights Documentation](https://vercel.com/docs/speed-insights)
- [Speed Insights Quickstart](https://vercel.com/docs/speed-insights/quickstart)
