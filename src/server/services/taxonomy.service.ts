import { prisma } from "@/server/db";

export class TaxonomyService {
  static async getTaxonomies(userId: string) {
    const [topics, categories, tags, collections] = await Promise.all([
      prisma.topic.findMany({
        where: { userId },
        orderBy: { name: "asc" },
      }),
      prisma.category.findMany({
        where: { userId },
        orderBy: { name: "asc" },
      }),
      prisma.tag.findMany({
        where: { userId },
        orderBy: { name: "asc" },
      }),
      prisma.collection.findMany({
        where: { userId },
        orderBy: { name: "asc" },
      }),
    ]);

    return { topics, categories, tags, collections };
  }

  static async createTopic(userId: string, name: string, description?: string, color?: string) {
    const slug = name.toLowerCase().replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "-") || "topic";
    return prisma.topic.create({
      data: { userId, name, slug, description, color },
    });
  }

  static async createCategory(userId: string, name: string, topicId?: string, color?: string) {
    const slug = name.toLowerCase().replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "-") || "cat";
    return prisma.category.create({
      data: { userId, name, slug, topicId, color },
    });
  }

  static async createTag(userId: string, name: string, color?: string) {
    const slug = name.toLowerCase().replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "-") || "tag";
    return prisma.tag.create({
      data: { userId, name, slug, color },
    });
  }

  static async createCollection(userId: string, name: string, description?: string, color?: string) {
    return prisma.collection.create({
      data: { userId, name, description, color },
    });
  }

  static async deleteCollection(userId: string, collectionId: string) {
    const col = await prisma.collection.findFirst({ where: { id: collectionId, userId } });
    if (!col) throw new Error("Collection not found");
    return prisma.collection.delete({ where: { id: collectionId } });
  }
}
