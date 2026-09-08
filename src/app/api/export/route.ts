import { NextResponse } from "next/server";
import { requireAuth } from "@/server/auth/session";
import { ImportExportService } from "@/server/services/import-export.service";

export async function GET(req: Request) {
  try {
    const user = await requireAuth();
    const url = new URL(req.url);
    const collectionId = url.searchParams.get("collectionId") || undefined;
    const topicId = url.searchParams.get("topicId") || undefined;

    const exportData = await ImportExportService.exportQuestionsJson(user.id, {
      collectionId,
      topicId,
    });

    return new NextResponse(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="mcq_export_${new Date().toISOString().slice(0, 10)}.json"`,
      },
    });
  } catch (error: any) {
    const status = error.message === "UNAUTHORIZED" ? 401 : 400;
    return NextResponse.json({ error: error.message || "Export failed." }, { status });
  }
}
