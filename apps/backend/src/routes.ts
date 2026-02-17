import type { Express } from "express";
import type { Server } from "http";
import { api } from "@fishmoney/shared/routes";
import type { N8nResponse } from "@fishmoney/shared/schema";

import { env } from "./env";
import { storage } from "./storage";

const sentimentMap: Record<string, N8nResponse["sentiment"]> = {
  bullish: "Bullish",
  positive: "Bullish",
  bear: "Bearish",
  bearish: "Bearish",
  negative: "Bearish",
  neutral: "Neutral",
  flat: "Neutral"
};

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

function getPathValue(source: Record<string, unknown>, path: string): unknown {
  const parts = path.split(".");
  let current: unknown = source;

  for (const part of parts) {
    const record = asRecord(current);
    if (!record) {
      return undefined;
    }

    current = record[part];
  }

  return current;
}

function pickValue(source: Record<string, unknown>, paths: string[]): unknown {
  for (const path of paths) {
    const value = getPathValue(source, path);
    if (value !== undefined && value !== null) {
      return value;
    }
  }

  return undefined;
}

function toNonEmptyString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function extractJsonSnippet(value: string): string | null {
  const start = value.search(/[{\[]/);
  if (start < 0) {
    return null;
  }

  const opener = value[start];
  const closer = opener === "{" ? "}" : "]";
  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let i = start; i < value.length; i += 1) {
    const char = value[i];

    if (inString) {
      if (escaped) {
        escaped = false;
        continue;
      }

      if (char === "\\") {
        escaped = true;
        continue;
      }

      if (char === "\"") {
        inString = false;
      }

      continue;
    }

    if (char === "\"") {
      inString = true;
      continue;
    }

    if (char === opener) {
      depth += 1;
    }

    if (char === closer) {
      depth -= 1;
      if (depth === 0) {
        return value.slice(start, i + 1);
      }
    }
  }

  return null;
}

function parsePossibleJson(value: string): unknown | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const parseCandidates = [trimmed];
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  if (fenced && fenced[1]) {
    parseCandidates.push(fenced[1].trim());
  }

  for (const candidate of parseCandidates) {
    try {
      const parsed = JSON.parse(candidate);

      if (typeof parsed === "string" && parsed.trim() && parsed.trim() !== candidate) {
        try {
          return JSON.parse(parsed);
        } catch {
          return parsed;
        }
      }

      return parsed;
    } catch {
      // Continue trying other candidates.
    }
  }

  const snippet = extractJsonSnippet(trimmed);
  if (!snippet || snippet === trimmed) {
    return null;
  }

  try {
    return JSON.parse(snippet);
  } catch {
    return null;
  }
}

function toNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const normalized = value.trim();
    if (!normalized) {
      return null;
    }

    const parsedFromJson = parsePossibleJson(normalized);
    if (parsedFromJson !== null && parsedFromJson !== value) {
      return toNumber(parsedFromJson);
    }

    const cleaned = normalized
      .replace(/,/g, "")
      .replace(/\s+/g, "")
      .replace(/[^0-9.+-]/g, "");

    if (!cleaned || cleaned === "." || cleaned === "+" || cleaned === "-" || cleaned === "+." || cleaned === "-.") {
      return null;
    }

    const parsed = Number(cleaned);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return null;
}

function toPercentString(value: unknown): string | null {
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) {
      return null;
    }

    const parsedFromJson = parsePossibleJson(trimmed);
    if (parsedFromJson !== null && parsedFromJson !== value) {
      return toPercentString(parsedFromJson);
    }

    if (/%/.test(trimmed)) {
      return trimmed.replace(/\s+/g, "");
    }

    const numeric = toNumber(trimmed);
    if (numeric !== null) {
      return `${numeric.toFixed(2)}%`;
    }

    return null;
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return `${value.toFixed(2)}%`;
  }

  return null;
}

function toSentiment(value: unknown): N8nResponse["sentiment"] | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.toLowerCase().trim();
  if (!normalized) {
    return null;
  }

  const exact = sentimentMap[normalized];
  if (exact) {
    return exact;
  }

  if (normalized.includes("bull") || normalized.includes("buy") || normalized.includes("up")) {
    return "Bullish";
  }

  if (normalized.includes("bear") || normalized.includes("sell") || normalized.includes("down")) {
    return "Bearish";
  }

  if (normalized.includes("neutral") || normalized.includes("hold") || normalized.includes("flat")) {
    return "Neutral";
  }

  return null;
}

function toHeadlines(value: unknown): string[] {
  if (typeof value === "string") {
    const parsed = parsePossibleJson(value);
    if (parsed !== null && parsed !== value) {
      return toHeadlines(parsed);
    }

    const trimmed = value.trim();
    return trimmed ? [trimmed] : [];
  }

  if (!Array.isArray(value)) {
    const record = asRecord(value);
    if (record) {
      const nested = record.items ?? record.headlines ?? record.news ?? record.data;
      if (nested !== undefined && nested !== value) {
        return toHeadlines(nested);
      }
    }

    return [];
  }

  return value
    .map((item) => {
      if (typeof item === "string") {
        return item.trim();
      }

      if (item && typeof item === "object") {
        const record = item as Record<string, unknown>;
        const title = typeof record.title === "string" ? record.title : "";
        const headline = typeof record.headline === "string" ? record.headline : "";
        const summary = typeof record.summary === "string" ? record.summary : "";
        const description = typeof record.description === "string" ? record.description : "";
        const text = typeof record.text === "string" ? record.text : "";
        return (title || headline || summary || description || text).trim();
      }

      return "";
    })
    .filter(Boolean)
    .slice(0, 5);
}

function looksLikeAnalysisPayload(record: Record<string, unknown>): boolean {
  const hasTicker = record.ticker !== undefined || record.symbol !== undefined;
  const hasMarketData =
    record.current_price !== undefined ||
    record.currentPrice !== undefined ||
    record.price !== undefined ||
    record.price_change_percent !== undefined ||
    record.change_percent !== undefined;
  const hasNarrative =
    record.analysis_summary !== undefined ||
    record.summary !== undefined ||
    record.sentiment !== undefined ||
    record.key_news_headlines !== undefined ||
    record.headlines !== undefined ||
    record.news !== undefined;

  return hasTicker && (hasMarketData || hasNarrative);
}

function unwrapPayload(raw: unknown, depth = 0): unknown {
  if (depth > 8) {
    return raw;
  }

  if (typeof raw === "string") {
    const parsed = parsePossibleJson(raw);
    return parsed !== null && parsed !== raw ? unwrapPayload(parsed, depth + 1) : raw;
  }

  if (Array.isArray(raw)) {
    if (raw.length === 0) {
      return raw;
    }

    const firstObject = raw.find((item) => item && typeof item === "object");
    return unwrapPayload(firstObject ?? raw[0], depth + 1);
  }

  if (!raw || typeof raw !== "object") {
    return raw;
  }

  const record = raw as Record<string, unknown>;
  if (looksLikeAnalysisPayload(record)) {
    return raw;
  }

  const wrappers = ["data", "result", "output", "json", "body", "payload", "item"];
  const metadataKeys = new Set([
    "status",
    "statusCode",
    "code",
    "headers",
    "ok",
    "meta",
    "id",
    "type",
    "pairedItem",
    "pairedItems",
    "index",
    "executionId"
  ]);

  for (const key of wrappers) {
    if (record[key] === undefined) {
      continue;
    }

    const wrapperValue = record[key];
    const siblingKeys = Object.keys(record).filter((itemKey) => itemKey !== key);
    const onlyMetadataSiblings = siblingKeys.every((siblingKey) => metadataKeys.has(siblingKey));

    if (onlyMetadataSiblings) {
      return unwrapPayload(wrapperValue, depth + 1);
    }

    const unwrappedWrapper = unwrapPayload(wrapperValue, depth + 1);
    const wrapperRecord = asRecord(unwrappedWrapper);

    if (wrapperRecord && looksLikeAnalysisPayload(wrapperRecord)) {
      return unwrappedWrapper;
    }

    if (Array.isArray(unwrappedWrapper)) {
      return unwrappedWrapper;
    }

    if (typeof unwrappedWrapper === "string") {
      const parsedFromString = parsePossibleJson(unwrappedWrapper);
      if (parsedFromString !== null) {
        return unwrapPayload(parsedFromString, depth + 1);
      }
    }
  }

  if (Array.isArray(record.items) && Object.keys(record).length <= 2) {
    return unwrapPayload(record.items, depth + 1);
  }

  return raw;
}

function parseWebhookBody(rawBody: string): unknown | null {
  const trimmed = rawBody.trim();
  if (!trimmed) {
    return null;
  }

  const parsed = parsePossibleJson(trimmed);
  return parsed ?? trimmed;
}

function buildWebhookCandidates(primaryUrl: string): string[] {
  const normalized = primaryUrl.trim();
  const candidates = [normalized];

  if (normalized.includes("/webhook-test/")) {
    candidates.push(normalized.replace("/webhook-test/", "/webhook/"));
  } else if (normalized.includes("/webhook/")) {
    candidates.push(normalized.replace("/webhook/", "/webhook-test/"));
  }

  return [...new Set(candidates)];
}

function formatErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return String(error);
}

function previewPayload(payload: unknown): string {
  try {
    const serialized = JSON.stringify(payload);
    if (!serialized) {
      return "<empty>";
    }

    return serialized.length > 600 ? `${serialized.slice(0, 600)}...` : serialized;
  } catch {
    const asString = String(payload);
    return asString.length > 600 ? `${asString.slice(0, 600)}...` : asString;
  }
}

async function fetchN8nPayload(ticker: string): Promise<unknown> {
  const webhookCandidates = buildWebhookCandidates(env.N8N_WEBHOOK_URL);
  const errors: string[] = [];

  for (const webhookUrl of webhookCandidates) {
    try {
      const n8nResponse = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json, text/plain, */*"
        },
        body: JSON.stringify({ ticker }),
        signal: AbortSignal.timeout(20_000)
      });

      if (!n8nResponse.ok) {
        errors.push(`${webhookUrl} -> HTTP ${n8nResponse.status}`);
        continue;
      }

      const parsedBody = parseWebhookBody(await n8nResponse.text());
      if (parsedBody === null) {
        errors.push(`${webhookUrl} -> empty response body`);
        continue;
      }

      return parsedBody;
    } catch (error) {
      errors.push(`${webhookUrl} -> ${formatErrorMessage(error)}`);
    }
  }

  throw new Error(`n8n webhook request failed (${errors.join("; ")})`);
}

function normalizeAnalysisPayload(payload: unknown, tickerFallback: string): N8nResponse | null {
  const unwrapped = unwrapPayload(payload);
  const directResult = api.analyze.responses[200].safeParse(unwrapped);

  if (directResult.success) {
    return directResult.data;
  }

  if (!unwrapped || typeof unwrapped !== "object" || Array.isArray(unwrapped)) {
    return null;
  }

  const candidate = unwrapped as Record<string, unknown>;
  const ticker =
    toNonEmptyString(
      pickValue(candidate, [
        "ticker",
        "symbol",
        "stock.ticker",
        "meta.ticker"
      ])
    ) ?? tickerFallback;
  const companyName =
    toNonEmptyString(
      pickValue(candidate, [
        "company_name",
        "companyName",
        "name",
        "company",
        "stock.name",
        "meta.company_name"
      ])
    ) ?? `${ticker.toUpperCase()} Corp.`;
  const rawPrice = pickValue(candidate, [
    "current_price",
    "currentPrice",
    "price",
    "quote.current_price",
    "quote.price",
    "stock.current_price",
    "stock.price",
    "market_data.current_price"
  ]);
  const currentPrice =
    toNumber(rawPrice) ?? 0;
  const currency =
    toNonEmptyString(
      pickValue(candidate, [
        "currency",
        "quote.currency",
        "stock.currency",
        "market_data.currency"
      ])
    ) ?? "USD";
  const rawPercentChange = pickValue(candidate, [
    "price_change_percent",
    "priceChangePercent",
    "change_percent",
    "changePercent",
    "quote.change_percent",
    "quote.price_change_percent",
    "market_data.change_percent"
  ]);
  const percentChange =
    toPercentString(rawPercentChange) ??
    "0.00%";
  const sentiment =
    toSentiment(
      pickValue(candidate, [
        "sentiment",
        "analysis.sentiment",
        "recommendation.sentiment"
      ])
    ) ?? "Neutral";
  const rawSummary = pickValue(candidate, [
    "analysis_summary",
    "summary",
    "analysis.summary",
    "analysis.text",
    "recommendation.summary",
    "commentary"
  ]);
  const summary =
    toNonEmptyString(rawSummary) ?? `Automated analysis for ${ticker.toUpperCase()} is currently limited.`;
  const primaryHeadlines = toHeadlines(
    pickValue(candidate, [
      "key_news_headlines",
      "analysis.key_news_headlines",
      "news.key_news_headlines"
    ])
  );
  const secondaryHeadlines = toHeadlines(
    pickValue(candidate, [
      "headlines",
      "analysis.headlines",
      "news.headlines"
    ])
  );
  const tertiaryHeadlines = toHeadlines(
    pickValue(candidate, [
      "news",
      "analysis.news",
      "news.items"
    ])
  );
  const headlines =
    primaryHeadlines.length > 0
      ? primaryHeadlines
      : secondaryHeadlines.length > 0
        ? secondaryHeadlines
        : tertiaryHeadlines;

  const hasPrimaryData =
    rawPrice !== undefined ||
    rawPercentChange !== undefined ||
    rawSummary !== undefined ||
    primaryHeadlines.length > 0 ||
    secondaryHeadlines.length > 0 ||
    tertiaryHeadlines.length > 0;

  if (!hasPrimaryData) {
    return null;
  }

  const normalized = {
    ticker: ticker.toUpperCase(),
    company_name: companyName,
    current_price: currentPrice,
    currency,
    price_change_percent: percentChange,
    sentiment,
    analysis_summary: summary,
    key_news_headlines:
      headlines.length > 0 ? headlines : [`No news headlines were returned for ${ticker.toUpperCase()}.`]
  };

  const normalizedResult = api.analyze.responses[200].safeParse(normalized);
  return normalizedResult.success ? normalizedResult.data : null;
}

function buildFallbackAnalysis(ticker: string): N8nResponse {
  const normalizedTicker = ticker.trim().toUpperCase();

  return {
    ticker: normalizedTicker,
    company_name: `${normalizedTicker} Corp.`,
    current_price: 0,
    currency: "USD",
    price_change_percent: "0.00%",
    sentiment: "Neutral",
    analysis_summary:
      "Live analyzer is temporarily unavailable. A fallback response is shown so the app can continue working.",
    key_news_headlines: [`Unable to fetch external news for ${normalizedTicker} right now.`]
  };
}

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

      const parsedBody = await fetchN8nPayload(input.ticker);
      const data = normalizeAnalysisPayload(parsedBody, input.ticker);
      if (!data) {
        throw new Error(
          `n8n webhook payload did not match expected analysis schema. Payload preview: ${previewPayload(parsedBody)}`
        );
      }

      storage
        .logAnalysis({
          ticker: input.ticker,
          result: data
        })
        .catch((err) => console.error("Failed to log analysis:", err));

      res.json(data);
    } catch (err) {
      const errorMessage = formatErrorMessage(err);
      console.error("Analysis error:", err);
      const fallbackInput = inputResult.success ? inputResult.data.ticker : "TICKER";
      const fallback = buildFallbackAnalysis(fallbackInput);

      storage
        .logAnalysis({
          ticker: fallback.ticker,
          result: fallback
        })
        .catch((storageErr) => console.error("Failed to log fallback analysis:", storageErr));

      res.status(502).json({
        message: `Failed to get live analysis from n8n. ${errorMessage}`
      });
    }
  });

  return httpServer;
}
