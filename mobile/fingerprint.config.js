// The fingerprint decides which installed APKs an OTA update targets. Leave
// expo.version out of it: the version is bumped on every build and every OTA
// publish, and that must not cut installed APKs off from updates.
const { SourceSkips } = require('@expo/fingerprint');

/** @type {import('@expo/fingerprint').Config} */
module.exports = {
  sourceSkips: SourceSkips.ExpoConfigVersions | SourceSkips.ExpoConfigRuntimeVersionIfString,
};
