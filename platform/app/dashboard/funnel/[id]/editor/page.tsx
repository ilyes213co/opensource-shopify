import FunnelEditorView from "@/components/dashboard/editor/FunnelEditorView";

interface PageProps {
  params: { id: string };
}

export const dynamic = "force-dynamic";

export default function FunnelEditorPage({ params }: PageProps) {
  return <FunnelEditorView storeId={params.id} />;
}
