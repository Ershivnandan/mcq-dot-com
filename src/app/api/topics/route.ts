import { NextResponse } from "next/server";
import { requireAuth } from "@/server/auth/session";
import { TaxonomyService } from "@/server/services/taxonomy.service";
import { prisma } from "@/server/db";

export async function GET() {
  try {
    const user = await requireAuth();
    const topics = await prisma.topic.findMany({
      where: { userId: user.id },
      orderBy: { name: "asc" },
      include: {
        _count: { select: { questions: true } },
      },
    });
    return NextResponse.json(topics);
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

    const topic = await TaxonomyService.createTopic(user.id, body.name, body.description, body.color);
    return NextResponse.json(topic, { status: 201 });
  } catch (error: any) {
    const status = error.message === "UNAUTHORIZED" ? 401 : 400;
    return NextResponse.json({ error: error.message }, { status });
  }
}
