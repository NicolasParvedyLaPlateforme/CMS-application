import LessonEditorClient from "@/components/LessonEditorClient";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  return <LessonEditorClient id={resolvedParams.id} />;
}
