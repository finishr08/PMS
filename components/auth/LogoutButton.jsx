
import { LogOut } from "lucide-react";
import { signOut } from "@/lib/auth";

export default function LogoutButton() {
  return (
    <form
      action={async () => {
        "use server";

        await signOut({
          redirectTo: "/login",
        });
      }}
    >
      <button
        type="submit"
        className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-border bg-white px-4 text-xs font-medium text-text-secondary hover:bg-slate-50"
      >
        <LogOut size={16} />
        <span>Logout</span>
      </button>
    </form>
  );
}
