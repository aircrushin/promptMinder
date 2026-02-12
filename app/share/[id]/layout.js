import { notFound } from "next/navigation";

export async function generateMetadata({ params }) {
  const { id } = (await params) || {};
  if (!id) return {};
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://prompt-minder.com";
    const res = await fetch(`${baseUrl}/api/share/${id}`, { next: { revalidate: 60 } });
    if (!res.ok) return {};
    const data = await res.json();
    const title = data?.title ? `${data.title} | Prompt Minder` : "Prompt 分享 | Prompt Minder";
    const description = data?.description || "查看并复制该提示词，或保存到工作台。";
    const url = `${baseUrl}/share/${id}`;
    return {
      title,
      description,
      alternates: { canonical: `/share/${id}` },
      openGraph: {
        title,
        description,
        url,
        type: "article",
        images: [
          { url: "/main-page.png", width: 1200, height: 630, alt: title },
        ],
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: ["/main-page.png"],
      },
    };
  } catch (e) {
    return {};
  }
}

export default function ShareLayout({ children }) {
  return children;
}





