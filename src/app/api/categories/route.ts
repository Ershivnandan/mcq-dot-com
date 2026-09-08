import { NextResponse } from "next/server";
import { requireAuth } from "@/server/auth/session";
import { TaxonomyService } from "@/server/services/taxonomy.service";
import { getCategoriesCol, getTopicsCol, getQuestionsCol, toObjectId, formatDoc } from "@/server/db";

export async function GET() {
  try {
    const user = await requireAuth();
    const categoriesCol = await getCategoriesCol();
    const topicsCol = await getTopicsCol();
    const questionsCol = await getQuestionsCol();

    const rawCategories = await categoriesCol.find({ userId: user.id }).sort({ name: 1 }).toArray();

    const topicIds = rawCategories.map((c) => c.topicId).filter((id): id is string => Boolean(id)).map(toObjectId);
    const topics = await topicsCol.find({ _id: { $in: topicIds } }).toArray();
    const topicMap = new Map(topics.map((t) => [t._id.toString(), t]));

    const categoriesWithCounts = await Promise.all(
      rawCategories.map(async (c) => {
        const catId = c._id ? c._id.toString() : c.id;
        const count = await questionsCol.countDocuments({ userId: user.id, categoryId: catId });
        const topic = c.topicId ? formatDoc(topicMap.get(c.topicId) || null) : null;
        return {
          ...formatDoc(c),
          topic,
          _count: { questions: count },
        };
      })
    );

    return NextResponse.json(categoriesWithCounts);
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
