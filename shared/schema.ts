import { pgTable, text, serial, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Log of analyzed tickers
export const analysisLog = pgTable("analysis_log", {
  id: serial("id").primaryKey(),
  ticker: text("ticker").notNull(),
  result: jsonb("result").notNull(), // Store the full webhook response
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertAnalysisLogSchema = createInsertSchema(analysisLog).omit({ 
  id: true, 
  createdAt: true 
});

// Explicit API types matching the n8n webhook response
export const n8nResponseSchema = z.object({
  ticker: z.string(),
  company_name: z.string(),
  current_price: z.number(),
  currency: z.string(),
  price_change_percent: z.string(),
  sentiment: z.enum(["Bullish", "Bearish", "Neutral"]),
  analysis_summary: z.string(),
  key_news_headlines: z.array(z.string()),
});

export type N8nResponse = z.infer<typeof n8nResponseSchema>;
export type AnalysisLog = typeof analysisLog.$inferSelect;
export type InsertAnalysisLog = z.infer<typeof insertAnalysisLogSchema>;
