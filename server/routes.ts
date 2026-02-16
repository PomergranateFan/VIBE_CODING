import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";

const N8N_WEBHOOK_URL = "https://gulman.app.n8n.cloud/webhook/analyze";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  app.post(api.analyze.path, async (req, res) => {
    try {
      const input = api.analyze.input.parse(req.body);
      
      console.log(`Analyzing ticker: ${input.ticker}`);

      // Call n8n webhook
      const n8nResponse = await fetch(N8N_WEBHOOK_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ticker: input.ticker }),
      });

      if (!n8nResponse.ok) {
        throw new Error(`n8n webhook failed with status: ${n8nResponse.status}`);
      }

      const data = await n8nResponse.json();
      
      // Log the result (fire and forget)
      storage.logAnalysis({
        ticker: input.ticker,
        result: data,
      }).catch(err => console.error("Failed to log analysis:", err));

      res.json(data);
    } catch (err) {
      console.error("Analysis error:", err);
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input" });
      }
      res.status(500).json({ message: "Failed to analyze ticker. The fish aren't biting today." });
    }
  });

  return httpServer;
}
