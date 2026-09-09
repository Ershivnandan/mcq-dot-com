import {
  getTopicsCol,
  getTagsCol,
  toObjectId,
  formatDocs,
  formatDoc,
} from "@/server/db";

export class TaxonomyService {
  static async getTaxonomies(userId: string) {
    const [topicsCol, tagsCol] = await Promise.all([
      getTopicsCol(),
      getTagsCol(),
    ]);

    const [topics, tags] = await Promise.all([
      topicsCol.find({ userId }).sort({ name: 1 }).toArray(),
      tagsCol.find({ userId }).sort({ name: 1 }).toArray(),
    ]);

    return {
      topics: formatDocs(topics),
      categories: [], // removed: month-wise division used instead
      tags: formatDocs(tags),
    };
  }

  static async createTopic(userId: string, name: string, description?: string, color?: string) {
    const trimmedName = name.trim();
    const slug = trimmedName.toLowerCase().replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "-") || "topic";
    const col = await getTopicsCol();

    // Check if topic already exists for this user (case-insensitive)
    const existing = await col.findOne({
      userId,
      name: { $regex: new RegExp(`^${trimmedName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") },
    });

    if (existing) {
      if (description !== undefined || color !== undefined) {
        await col.updateOne(
          { _id: existing._id },
          {
            $set: {
              ...(description !== undefined ? { description: description?.trim() || null } : {}),
              ...(color !== undefined ? { color } : {}),
              updatedAt: new Date(),
            },
          }
        );
      }
      return formatDoc(existing);
    }

    const doc = {
      userId,
      name: trimmedName,
      slug,
      description: description?.trim() || null,
      color: color || "#6366f1",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const res = await col.insertOne(doc);
    return formatDoc({ ...doc, _id: res.insertedId });
  }

  static async updateTopic(
    userId: string,
    topicId: string,
    data: { name?: string; description?: string | null; color?: string | null }
  ) {
    const col = await getTopicsCol();
    const updateFields: any = { updatedAt: new Date() };

    if (data.name !== undefined) {
      updateFields.name = data.name.trim();
      updateFields.slug = data.name.toLowerCase().replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "-") || "topic";
    }
    if (data.description !== undefined) {
      updateFields.description = data.description ? data.description.trim() : null;
    }
    if (data.color !== undefined) {
      updateFields.color = data.color;
    }

    const res = await col.findOneAndUpdate(
      { _id: toObjectId(topicId), userId },
      { $set: updateFields },
      { returnDocument: "after" }
    );

    if (!res) throw new Error("Topic not found");
    return formatDoc(res);
  }

  static async deleteTopic(userId: string, topicId: string) {
    const col = await getTopicsCol();
    const res = await col.deleteOne({ _id: toObjectId(topicId), userId });
    if (res.deletedCount === 0) throw new Error("Topic not found");
    return true;
  }

  static async createTag(userId: string, name: string, color?: string) {
    const slug = name.toLowerCase().replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "-") || "tag";
    const col = await getTagsCol();
    const doc = {
      userId,
      name: name.trim(),
      slug,
      color: color || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const res = await col.insertOne(doc);
    return formatDoc({ ...doc, _id: res.insertedId });
  }
}

