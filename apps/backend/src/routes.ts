import type { Express } from "express";
import type { Server } from "http";
import { api } from "@fishmoney/shared/routes";

import { env } from "./env";
import { storage } from "./storage";

export async function registerRoutes(httpServer: Server, app: Express): Promise<Server> {
  app.get(api.health.path, (_req, res) => {
    res.json({ status: "ok" });
  });

  app.post(api.analyze.path, async (req, res) => {
    const inputResult = api.analyze.input.safeParse(req.body);
    if (!inputResult.success) {
      return res.status(400).json({ message: "Invalid input" });
    }

    try {
      const input = inputResult.data;

      console.log(`Analyzing ticker: ${input.ticker}`);

      const n8nResponse = await fetch(env.N8N_WEBHOOK_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ ticker: input.ticker })
      });

      if (!n8nResponse.ok) {
        throw new Error(`n8n webhook failed with status: ${n8nResponse.status}`);
      }

      const data = api.analyze.responses[200].parse(await n8nResponse.json());

      storage
        .logAnalysis({
          ticker: input.ticker,
          result: data
        })
        .catch((err) => console.error("Failed to log analysis:", err));

      res.json(data);
    } catch (err) {
      console.error("Analysis error:", err);
      res.status(500).json({ message: "Failed to analyze ticker. The fish aren't biting today." });
    }
  });

  return httpServer;
}
