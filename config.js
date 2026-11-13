// SMH WORLD MAP — provider settings. Leave null/'' until you have keys. The app works without any of them.
// Firebase web keys are NOT secret; protect them with "Authorized domains" in the Firebase console.
window.SMH_CONFIG = {
  firebase: null, // e.g. { apiKey:"...", authDomain:"x.firebaseapp.com", projectId:"x", appId:"..." }
  trafficKey: "", // Phase 2 (TomTom / HERE free tier)
  mapillaryToken: "" // Phase 2 street-level imagery
};
