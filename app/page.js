import PageContainer from "@/components/ui/PageContainer";
import Button from "@/components/ui/Button";

export default function HomePage() {
  return (
    <PageContainer className="max-w-lg">
      <div className="app-card px-8 py-12 text-center sm:px-12">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary-light">
          <span className="text-4xl" aria-hidden="true">
            🖨️
          </span>
        </div>

        <h1 className="text-3xl font-bold text-text-primary">Welcome</h1>

        <p className="mt-3 text-text-secondary">
          Ready to print your documents
        </p>

        <div className="mt-8 rounded-xl border border-border px-4 py-4">
          <p className="text-sm text-text-secondary">
            Printer: HP LaserJet 3055
          </p>

          <span className="status-ready mt-2">
            <span className="status-dot" />
            Demo Status: Ready
          </span>
        </div>

        <Button className="mt-6 w-full">Print Document</Button>

        <p className="mt-4 text-sm text-text-secondary">
          Upload and print PDF files
        </p>
      </div>
    </PageContainer>
  );
}
