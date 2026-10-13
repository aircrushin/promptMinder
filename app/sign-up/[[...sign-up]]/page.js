import { SignUp } from "@clerk/nextjs";
import { ThemeToggle } from '@/components/theme/ThemeToggle';

export default function Page() {
  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 py-10 bg-gradient-to-br from-sky-50 via-white to-emerald-50 dark:from-zinc-900 dark:via-black dark:to-zinc-900">
      <div className="absolute right-4 top-4"><ThemeToggle /></div>
      <SignUp forceRedirectUrl="/prompts" />
    </div>
  );
}
