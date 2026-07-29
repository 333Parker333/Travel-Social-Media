// app.config.js instead of app.json so the web base path can be set
// conditionally: GitHub Pages serves this repo at /Travel-Social-Media/
// (a project site, not a custom domain), but local dev (`npm run web`)
// serves from root - hardcoding the path in static app.json would break
// local dev. Only the GitHub Pages deploy workflow sets WEB_BASE_PATH.
const config = {
  expo: {
    name: 'Travel-Social-Media',
    slug: 'Travel-Social-Media',
    version: '1.0.0',
    orientation: 'portrait',
    userInterfaceStyle: 'light',
    ios: {
      supportsTablet: true,
    },
    android: {
      predictiveBackGestureEnabled: false,
    },
    plugins: [
      [
        'expo-image-picker',
        {
          photosPermission: 'Allow Trip Deck to access your photos so you can import booking confirmations.',
          cameraPermission: 'Allow Trip Deck to use the camera so you can photograph booking confirmations.',
        },
      ],
    ],
  },
};

if (process.env.WEB_BASE_PATH) {
  config.expo.experiments = { baseUrl: process.env.WEB_BASE_PATH };
}

module.exports = config;
