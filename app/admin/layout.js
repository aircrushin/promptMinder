import AdminLayoutClient from "./AdminLayoutClient";

export const metadata = {
  title: "管理后台",
  description: "Prompt Minder 管理后台（不对搜索引擎开放）。",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }) {
  return <AdminLayoutClient>{children}</AdminLayoutClient>;
}
