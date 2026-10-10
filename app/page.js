import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

import WelcomeCard from "@/components/home/WelcomeCard";
import LogoutButton from "@/components/auth/LogoutButton";

export const metadata = {
  title: "Welcome | Printing Management System",
};

export default async function HomePage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <>
      <WelcomeCard />

      <div className="fixed bottom-6 right-6 z-20">
        <LogoutButton />
      </div>
    </>
  );
}
