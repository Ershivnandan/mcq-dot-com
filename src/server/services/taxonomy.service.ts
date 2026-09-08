import {
  getTopicsCol,
  getCategoriesCol,
  getTagsCol,
  getCollectionsCol,
  toObjectId,
  formatDocs,
  formatDoc,
} from "@/server/db";

export class TaxonomyService {
  static async getTaxonomies(userId: string) {
    const [topicsCol, categoriesCol, tagsCol, collectionsCol] = await Promise.all([
      getTopicsCol(),
      getCategoriesCol(),
      getTagsCol(),
      getCollectionsCol(),
    ]);

    const [topics, categories, tags, collections] = await Promise.all([
      topicsCol.find({ userId }).sort({ name: 1 }).toArray(),
      categoriesCol.find({ userId }).sort({ name: 1 }).toArray(),
      tagsCol.find({ userId }).sort({ name: 1 }).toArray(),
      collectionsCol.find({ userId }).sort({ name: 1 }).toArray(),
    ]);

    return {
      topics: formatDocs(topics),
      categories: formatDocs(categories),
      tags: formatDocs(tags),
      collections: formatDocs(collections),
    };
  }

  static async createTopic(userId: string, name: string, description?: string, color?: string) {
    const slug = name.toLowerCase().replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "-") || "topic";
    const col = await getTopicsCol();
    const doc = {
      userId,
      name,
      slug,
      description: description || null,
      color: color || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const res = await col.insertOne(doc);
    return formatDoc({ ...doc, _id: res.insertedId });
  }

  static async createCategory(userId: string, name: string, topicId?: string, color?: string) {
    const slug = name.toLowerCase().replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "-") || "cat";
    const col = await getCategoriesCol();
    const doc = {
      userId,
      name,
      slug,
      topicId: topicId || null,
      color: color || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const res = await col.insertOne(doc);
    return formatDoc({ ...doc, _id: res.insertedId });
  }

  static async createTag(userId: string, name: string, color?: string) {
    const slug = name.toLowerCase().replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "-") || "tag";
    const col = await getTagsCol();
    const doc = {
      userId,
      name,
      slug,
      color: color || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const res = await col.insertOne(doc);
    return formatDoc({ ...doc, _id: res.insertedId });
  }

  static async createCollection(userId: string, name: string, description?: string, color?: string) {
    const col = await getCollectionsCol();
    const doc = {
      userId,
      name,
      description: description || null,
      color: color || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const res = await col.insertOne(doc);
    return formatDoc({ ...doc, _id: res.insertedId });
  }

  static async deleteCollection(userId: string, collectionId: string) {
    const col = await getCollectionsCol();
    const res = await col.deleteOne({ _id: toObjectId(collectionId), userId });
    if (res.deletedCount === 0) throw new Error("Collection not found");
    return true;
  }
}
