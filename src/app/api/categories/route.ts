import { NextResponse } from "next/server";
import { requireAuth } from "@/server/auth/session";
import { TaxonomyService } from "@/server/services/taxonomy.service";
import { prisma } from "@/server/db";

export async function GET() {
  try {
    const user = await requireAuth();
    const categories = await prisma.category.findMany({
      where: { userId: user.id },
      orderBy: { name: "asc" },
      include: {
        topic: true,
        _count: { select: { questions: true } },
      },
    });
    return NextResponse.json(categories);
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

    const category = await TaxonomyService.createCategory(user.id, body.name, body.topicId, body.color);
    return NextResponse.json(category, { status: 201 });
  } catch (error: any) {
    const status = error.message === "UNAUTHORIZED" ? 401 : 400;
    return NextResponse.json({ error: error.message }, { status });
  }
}
