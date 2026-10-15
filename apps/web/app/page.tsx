import { RecordTastingForm } from "./record-tasting-form";

export default function Home() {
  return (
    <main className="mx-auto max-w-xl px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">tea-rate</h1>
      <p className="mt-2 text-stone-600">
        Your personal tea journal. Rate a tea from the catalog to get started.
      </p>
      <RecordTastingForm />
    </main>
  );
}
