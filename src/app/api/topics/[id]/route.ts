import { NextResponse } from "next/server";
import { requireAuth } from "@/server/auth/session";
import { TaxonomyService } from "@/server/services/taxonomy.service";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const body = await req.json();

    const updated = await TaxonomyService.updateTopic(user.id, id, {
      name: body.name,
      description: body.description,
      color: body.color,
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    const status = error.message === "UNAUTHORIZED" ? 401 : 400;
    return NextResponse.json({ error: error.message }, { status });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return PUT(req, { params });
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    await TaxonomyService.deleteTopic(user.id, id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    const status = error.message === "UNAUTHORIZED" ? 401 : 400;
    return NextResponse.json({ error: error.message }, { status });
  }
}
