# Showroom Showdown: Chess — iPhone

This dedicated app targets the renamed original Inkora App Store record (6813326915, bundle ID com.danielquintanilla.inkora). It reuses the original Expo project 91683c4b-a977-459d-b7e6-94c9e895efa8. Its internal Expo slug remains inkora for that existing project; its display name is Showroom Showdown: Chess. BizzLotz has a different app record and Expo project.

The WKWebView loads an embedded HTML game, not the Render site. All game code, sprites, backdrop and the local AI worker are bundled. Native AsyncStorage persists games/preferences, and PGN export uses the iOS share sheet. No accounts, payments, ads or remote analytics are included.

Build 20 includes the dealership role silhouettes, procedural Foley, and verified offline styles. Build 19 and the first build-20 attempt were superseded after visual inspection found malformed CSS caused by removing a font import at a semicolon inside its URL. The packager now reads the standalone stylesheet and removes the whole import; the offline test asserts layout and body styles. Previous Inkora build 18 is not the chess game. App Store screenshots, old tattoo metadata, age-rating/privacy answers and review notes must be reviewed before any public release. Actual WKWebView behavior and performance require TestFlight validation on an iPhone.

## Source and build

Canonical source: profitpilot-app/dealership-rush, feature/dealership-chess, mobile directory. A standalone snapshot is placed in profitpilot-app/inkora-app on feature/showroom-showdown-ios for the existing Expo GitHub integration. Do not merge this branch into BizzLotz main.

From the canonical repository: npm ci --prefix chess; npm ci --prefix mobile; npm --prefix mobile run bundle:game. Generated game.js is committed so cloud builds do not need sibling web sources. To compile the native bundle: cd mobile; npm run typecheck; npx expo export --platform ios. EAS production builds and submissions target only the renamed Inkora record.

Local checks: TypeScript, iOS Metro/Hermes export, offline desktop-WebView simulation (start, move, save/restore, AI, sprites and PGN bridge). Browser simulation is not a physical iPhone test.
