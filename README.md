# SMH WORLD MAP — Phase 1
Files: index.html, styles.css, app.js, config.js, sw.js, manifest.webmanifest, icon.svg (all new; the old ORBISTRA/Google-Maps files are replaced).
## Upload from your phone (GitHub)
1. Open your repo in the browser → **Add file → Upload files**. 2. Upload all 7 files (same names overwrite the old ones). 3. Delete the old files you no longer need (open file → ⋯ → Delete). 4. Commit. 5. Repo **Settings → Pages**: deploy from branch **main**, folder **/ (root)**. 6. Wait 1 minute, open your Pages link; if you see the old version, clear site data once (the old service worker).
## Keys (all optional)
Firebase login: console.firebase.google.com → new project → Authentication → enable Email/Password and Google → Add web app → copy the config into config.js → add your github.io domain under Authentication → Settings → Authorized domains.
## Android later
Use Trusted Web Activity (Bubblewrap) or Capacitor to wrap the HTTPS site, then publish via Google Play Console (one-time $25 fee). A website is not a Play Store app by itself.
