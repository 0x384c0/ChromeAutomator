import { defineManifest } from "@crxjs/vite-plugin";

export default defineManifest({
  manifest_version: 3,
  version: "0.0.1",
  name: "Chrome Automator",
  description: "Tools for scrape data from web",
  icons: {
    "16": "img/logo-16.png",
    "48": "img/logo-48.png",
    "128": "img/logo-128.png",
  },
  action: {
    default_popup: "src/popup/index.html",
    default_icon: "img/logo-48.png",
  },
  devtools_page: "src/devtools/index.html",
  content_scripts: [
    {
      matches: ["<all_urls>"],
      js: ["src/content/index.ts"],
      all_frames: true,
    },
  ],
  web_accessible_resources: [
    {
      resources: [
        "img/logo-16.png",
        "img/logo-48.png",
        "img/logo-128.png",
      ],
      matches: [],
    },
  ],
  permissions: ["debugger", "activeTab", "tabs", "storage", "webRequest"],
  host_permissions: ["<all_urls>"], // Fix from https://github.com/crxjs/chrome-extension-tools/issues/971#issuecomment-2605091492
});
