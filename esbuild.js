const { build } = require("esbuild");
const copyStaticFiles = require("esbuild-copy-static-files");

const production = process.argv.includes('--production');

const baseConfig = {
  bundle: true,
  minify: production,
  sourcemap: !production,
};

const extensionConfig = {
  ...baseConfig,
  platform: "node",
  mainFields: ["module", "main"],
  format: "cjs",
  entryPoints: ["./src/extension.ts"],
  outfile: "./out/extension.js",
  external: ["vscode"]
};


const webviewConfig = {
  ...baseConfig,
  platform: "node",
  target: "es2020",
  format: "esm",
  entryPoints: ["./src/webview/main.ts"],
  outfile: "./out/webview.js",
  plugins: [
   copyStaticFiles({
     src: "node_modules/leaflet/dist/leaflet.css", 
     dest: "out/leaflet.css",             
  }),
    ]
};

const mapWebviewConfig = {
  ...baseConfig,
  entryPoints: ["./src/webview/map.ts"],
  platform: "node",
  target: "es2020",
  sourcesContent: false,
  format: "esm",
  external:['vscode'],
  outfile: "./out/mapWebview.js",
};

const watchConfig = {
  watch: {
    onRebuild(error, result) {
      console.log("[watch] build started");
      if (error) {
        error.errors.forEach(error =>
          console.error(`> ${error.location.file}:${error.location.line}:${error.location.column}: error: ${error.text}`)
        );
      } else {
        console.log("[watch] build finished");
      }
    },
  },
};



(async () => {
  const args = process.argv.slice(2);
  try {
    if (args.includes("--watch")) {
      // Build and watch extension and webview code
      console.log("[watch] build started");
      await build({
        ...extensionConfig,
        ...watchConfig,
      });
      await build({
        ...webviewConfig,
        ...watchConfig,
      });
      await build({
        ...mapWebviewConfig,
        ...watchConfig,
      });
      console.log("[watch] build finished");
    } else {
      // Build extension and webview code
      await build(extensionConfig);
      await build(webviewConfig);
      await build(mapWebviewConfig);
      console.log("build complete");
    }
  } catch (err) {
    process.stderr.write(err.stderr);
    process.exit(1);
  }
})();
