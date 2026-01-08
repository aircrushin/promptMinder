const siteUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://prompt-minder.com";

export default function manifest() {
  return {
    name: "Prompt Minder",
    short_name: "Prompt Minder",
    description: "专业的 AI 提示词管理平台：版本控制、团队协作、智能分类。",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#000000",
    scope: "/",
    icons: [
      {
        src: "/logo2.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/logo2.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
    categories: ["productivity", "utilities"],
    id: siteUrl,
  };
}

