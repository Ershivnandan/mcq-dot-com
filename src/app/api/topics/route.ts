import { NextResponse } from "next/server";
import { requireAuth } from "@/server/auth/session";
import { TaxonomyService } from "@/server/services/taxonomy.service";
import { getTopicsCol, getQuestionsCol, formatDoc } from "@/server/db";

export async function GET() {
  try {
    const user = await requireAuth();
    const topicsCol = await getTopicsCol();
    const questionsCol = await getQuestionsCol();

    const rawTopics = await topicsCol.find({ userId: user.id }).sort({ name: 1 }).toArray();

    // Attach question counts
    const topicsWithCounts = await Promise.all(
      rawTopics.map(async (t) => {
        const topicId = t._id ? t._id.toString() : t.id;
        const count = await questionsCol.countDocuments({ userId: user.id, topicId });
        return {
          ...formatDoc(t),
          _count: { questions: count },
        };
      })
    );

    return NextResponse.json(topicsWithCounts);
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
