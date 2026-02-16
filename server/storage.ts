import { db } from "./db";
import { analysisLog, type InsertAnalysisLog, type AnalysisLog } from "@shared/schema";

export interface IStorage {
  logAnalysis(log: InsertAnalysisLog): Promise<AnalysisLog>;
}

export class DatabaseStorage implements IStorage {
  async logAnalysis(log: InsertAnalysisLog): Promise<AnalysisLog> {
    const [entry] = await db.insert(analysisLog).values(log).returning();
    return entry;
  }
}

export const storage = new DatabaseStorage();
