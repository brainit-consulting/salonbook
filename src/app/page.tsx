import { salon } from "@/lib/salon/config";

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-xl px-4 py-12">
      <h1 className="text-5xl">{salon.name}</h1>
    </main>
  );
}
