import { MongoClient, Db, ObjectId, Collection } from "mongodb";
import {
  UserDocument,
  SessionDocument,
  UserPreferenceDocument,
  AIProviderConfigDocument,
  AIUsageLogDocument,
  TopicDocument,
  CategoryDocument,
  TagDocument,
  CollectionDocument,
  QuestionDocument,
  QuestionProgressDocument,
  QuizDocument,
  QuizAttemptDocument,
  AIDraftQuestionDocument,
} from "@/types/database";

const uri = process.env.DATABASE_URL || "mongodb://localhost:27017/mcq_quiz_manager";

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

if (!global._mongoClientPromise) {
  client = new MongoClient(uri, {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
  });
  global._mongoClientPromise = client.connect();
}
clientPromise = global._mongoClientPromise;

export async function getMongoClient(): Promise<MongoClient> {
  return clientPromise;
}

export async function getDb(): Promise<Db> {
  const c = await getMongoClient();
  return c.db();
}

/**
 * Helper to convert string or ObjectId into a safe ObjectId
 */
export function toObjectId(id: string | ObjectId): ObjectId {
  if (id instanceof ObjectId) return id;
  try {
    return new ObjectId(id);
  } catch {
    return new ObjectId();
  }
}

/**
 * Transforms MongoDB document so _id is also available as string `id`.
 */
export function formatDoc<T extends { _id?: ObjectId; id?: string }>(doc: T): T & { id: string };
export function formatDoc<T extends { _id?: ObjectId; id?: string }>(doc: T | null): (T & { id: string }) | null;
export function formatDoc<T extends { _id?: ObjectId; id?: string }>(doc: T | null): (T & { id: string }) | null {
  if (!doc) return null;
  return {
    ...doc,
    id: doc._id ? doc._id.toString() : (doc.id || ""),
  };
}

export function formatDocs<T extends { _id?: ObjectId; id?: string }>(docs: T[]): (T & { id: string })[] {
  return docs.map((d) => ({
    ...d,
    id: d._id ? d._id.toString() : (d.id || ""),
  }));
}

// Typed Collection Accessors
export async function getUsersCol(): Promise<Collection<UserDocument>> {
  const db = await getDb();
  return db.collection<UserDocument>("users");
}

export async function getSessionsCol(): Promise<Collection<SessionDocument>> {
  const db = await getDb();
  return db.collection<SessionDocument>("sessions");
}

export async function getUserPreferencesCol(): Promise<Collection<UserPreferenceDocument>> {
  const db = await getDb();
  return db.collection<UserPreferenceDocument>("user_preferences");
}

export async function getAIProviderConfigsCol(): Promise<Collection<AIProviderConfigDocument>> {
  const db = await getDb();
  return db.collection<AIProviderConfigDocument>("ai_provider_configs");
}

export async function getAIUsageLogsCol(): Promise<Collection<AIUsageLogDocument>> {
  const db = await getDb();
  return db.collection<AIUsageLogDocument>("ai_usage_logs");
}

export async function getTopicsCol(): Promise<Collection<TopicDocument>> {
  const db = await getDb();
  return db.collection<TopicDocument>("topics");
}

export async function getCategoriesCol(): Promise<Collection<CategoryDocument>> {
  const db = await getDb();
  return db.collection<CategoryDocument>("categories");
}

export async function getTagsCol(): Promise<Collection<TagDocument>> {
  const db = await getDb();
  return db.collection<TagDocument>("tags");
}

export async function getCollectionsCol(): Promise<Collection<CollectionDocument>> {
  const db = await getDb();
  return db.collection<CollectionDocument>("collections");
}

export async function getQuestionsCol(): Promise<Collection<QuestionDocument>> {
  const db = await getDb();
  return db.collection<QuestionDocument>("questions");
}

export async function getQuestionProgressCol(): Promise<Collection<QuestionProgressDocument>> {
  const db = await getDb();
  return db.collection<QuestionProgressDocument>("question_progress");
}

export async function getQuizzesCol(): Promise<Collection<QuizDocument>> {
  const db = await getDb();
  return db.collection<QuizDocument>("quizzes");
}

export async function getQuizAttemptsCol(): Promise<Collection<QuizAttemptDocument>> {
  const db = await getDb();
  return db.collection<QuizAttemptDocument>("quiz_attempts");
}

export async function getAIDraftsCol(): Promise<Collection<AIDraftQuestionDocument>> {
  const db = await getDb();
  return db.collection<AIDraftQuestionDocument>("ai_draft_questions");
}

/**
 * Ensures indexes exist on MongoDB collections.
 * Safe to call multiple times (idempotent).
 */
let indexesCreated = false;
export async function ensureIndexes(): Promise<void> {
  if (indexesCreated) return;
  try {
    const db = await getDb();
    await Promise.all([
      db.collection("users").createIndex({ email: 1 }, { unique: true }),
      db.collection("sessions").createIndex({ token: 1 }, { unique: true }),
      db.collection("sessions").createIndex({ userId: 1 }),
      db.collection("topics").createIndex({ userId: 1, name: 1 }, { unique: true }),
      db.collection("categories").createIndex({ userId: 1, name: 1 }, { unique: true }),
      db.collection("tags").createIndex({ userId: 1, name: 1 }, { unique: true }),
      db.collection("collections").createIndex({ userId: 1, name: 1 }, { unique: true }),
      db.collection("questions").createIndex({ userId: 1, questionDate: -1 }),
      db.collection("questions").createIndex({ userId: 1, createdAt: -1 }),
      db.collection("question_progress").createIndex({ questionId: 1 }, { unique: true }),
      db.collection("question_progress").createIndex({ userId: 1, nextReviewAt: 1 }),
      db.collection("ai_provider_configs").createIndex({ userId: 1, provider: 1 }, { unique: true }),
      db.collection("ai_draft_questions").createIndex({ userId: 1, status: 1 }),
    ]);
    indexesCreated = true;
  } catch (err) {
    console.warn("MongoDB ensureIndexes non-fatal error:", err);
  }
}
