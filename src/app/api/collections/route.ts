import { NextResponse } from "next/server";
import { requireAuth } from "@/server/auth/session";
import { TaxonomyService } from "@/server/services/taxonomy.service";
import { getCollectionsCol, getQuestionsCol, formatDoc } from "@/server/db";

export async function GET() {
  try {
    const user = await requireAuth();
    const collectionsCol = await getCollectionsCol();
    const questionsCol = await getQuestionsCol();

    const rawCollections = await collectionsCol.find({ userId: user.id }).sort({ name: 1 }).toArray();

    const collectionsWithCounts = await Promise.all(
      rawCollections.map(async (c) => {
        const colId = c._id ? c._id.toString() : c.id;
        const count = await questionsCol.countDocuments({ userId: user.id, collectionIds: colId });
        return {
          ...formatDoc(c),
          _count: { questions: count },
        };
      })
    );

    return NextResponse.json(collectionsWithCounts);
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

    const collection = await TaxonomyService.createCollection(
      user.id,
      body.name,
      body.description,
      body.color
    );
    return NextResponse.json(collection, { status: 201 });
  } catch (error: any) {
    const status = error.message === "UNAUTHORIZED" ? 401 : 400;
    return NextResponse.json({ error: error.message }, { status });
  }
}
