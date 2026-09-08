import { NextResponse } from "next/server";
import { requireAuth } from "@/server/auth/session";
import { ImportExportService } from "@/server/services/import-export.service";

export async function POST(req: Request) {
  try {
    const user = await requireAuth();
    const body = await req.json();

    const summary = await ImportExportService.importBackupJson(user.id, body);
    return NextResponse.json({ success: true, summary });
  } catch (error: any) {
    const status = error.message === "UNAUTHORIZED" ? 401 : 400;
    return NextResponse.json({ error: error.message || "Import failed." }, { status });
  }
}
