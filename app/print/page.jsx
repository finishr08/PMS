import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import PrintDocumentForm from "@/components/print/PrintDocumentForm";

export const metadata = {
  title: "Print Document | PMS",
};

export default async function PrintPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return <PrintDocumentForm />;
}
