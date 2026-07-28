// https://docs.expo.dev/guides/using-eslint/
const expoConfig = require('eslint-config-expo/flat');

module.exports = [
  ...expoConfig,
  // Deno Edge Functions - different runtime/globals, linted separately (if at all).
  { ignores: ['supabase/functions/**'] },
];
