import { z } from 'zod';
import { n8nResponseSchema } from './schema';

export const api = {
  health: {
    method: 'GET' as const,
    path: '/api/health' as const,
    responses: {
      200: z.object({ status: z.literal("ok") }),
    },
  },
  analyze: {
    method: 'POST' as const,
    path: '/api/analyze' as const,
    input: z.object({
      ticker: z.string().min(1),
    }),
    responses: {
      200: n8nResponseSchema,
      400: z.object({ message: z.string() }),
      500: z.object({ message: z.string() }),
    },
  },
};

// Helper for URL building (required by frontend)
export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
