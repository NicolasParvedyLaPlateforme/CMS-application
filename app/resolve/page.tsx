import ResolveClient from "@/components/ResolveClient";
import { Suspense } from "react";

export default function ResolvePage() {
  return (
    <Suspense fallback={<div>Chargement...</div>}>
      <ResolveClient />
    </Suspense>
  );
}
