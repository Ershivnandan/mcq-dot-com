import { NextResponse } from "next/server";
import { requireAuth } from "@/server/auth/session";
import { TaxonomyService } from "@/server/services/taxonomy.service";

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    await TaxonomyService.deleteCollection(user.id, id);
    return NextResponse.json({ message: "Collection deleted successfully" });
  } catch (error: any) {
    const status = error.message === "UNAUTHORIZED" ? 401 : 400;
    return NextResponse.json({ error: error.message }, { status });
  }
}
