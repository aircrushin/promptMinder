import { SignUp } from "@clerk/nextjs";

export default function Page() {
  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 py-10 bg-gradient-to-br from-sky-50 via-white to-emerald-50 dark:from-zinc-900 dark:via-black dark:to-zinc-900">
      <SignUp forceRedirectUrl="/prompts" />
    </div>
  );
}
