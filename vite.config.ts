import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import vinext from "vinext";
import { cloudflare } from "@cloudflare/vite-plugin";

// Read by next.config.js so `vite build` does not emit Next's Node standalone server.
process.env.VINEXT_CLOUDFLARE_BUILD = "1";

const sharpStub = fileURLToPath(new URL("./lib/sharp-worker-stub.js", import.meta.url));
const premiumSkillsWorker = fileURLToPath(
  new URL("./lib/premium-skills-worker.js", import.meta.url),
);

export default defineConfig({
  plugins: [
    vinext(),
    cloudflare({
      viteEnvironment: {
        name: "rsc",
        childEnvironments: ["ssr"],
      },
    }),
  ],
  resolve: {
    alias: [
      { find: "sharp", replacement: sharpStub },
      { find: "@/lib/premium-skills-server", replacement: premiumSkillsWorker },
      { find: "@/lib/premium-skills-server.js", replacement: premiumSkillsWorker },
    ],
  },
});
