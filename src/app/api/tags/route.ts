import { NextResponse } from "next/server";
import { requireAuth } from "@/server/auth/session";
import { TaxonomyService } from "@/server/services/taxonomy.service";
import { prisma } from "@/server/db";

export async function GET() {
  try {
    const user = await requireAuth();
    const tags = await prisma.tag.findMany({
      where: { userId: user.id },
      orderBy: { name: "asc" },
      include: {
        _count: { select: { questions: true } },
      },
    });
    return NextResponse.json(tags);
  } catch (error: any) {
    const status = error.message === "UNAUTHORIZED" ? 401 : 400;
    return NextResponse.json({ error: error.message }, { status });
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireAuth();
    const body = await req.json();
    if (!body.name) return NextResponse.json({ error: "Name is required" }, { status: 400 });

    const tag = await TaxonomyService.createTag(user.id, body.name, body.color);
    return NextResponse.json(tag, { status: 201 });
  } catch (error: any) {
    const status = error.message === "UNAUTHORIZED" ? 401 : 400;
    return NextResponse.json({ error: error.message }, { status });
  }
}
