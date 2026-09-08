import { NextResponse } from "next/server";
import { requireAuth } from "@/server/auth/session";
import { TaxonomyService } from "@/server/services/taxonomy.service";
import { getTagsCol, getQuestionsCol, formatDoc } from "@/server/db";

export async function GET() {
  try {
    const user = await requireAuth();
    const tagsCol = await getTagsCol();
    const questionsCol = await getQuestionsCol();

    const rawTags = await tagsCol.find({ userId: user.id }).sort({ name: 1 }).toArray();

    const tagsWithCounts = await Promise.all(
      rawTags.map(async (t) => {
        const tagId = t._id ? t._id.toString() : t.id;
        const count = await questionsCol.countDocuments({ userId: user.id, tagIds: tagId });
        return {
          ...formatDoc(t),
          _count: { questions: count },
        };
      })
    );

    return NextResponse.json(tagsWithCounts);
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
