/**
 * AI Service - Backend Orchestration for LLM Analysis
 * Handles prompts, caching, and token control
 */

import { db } from '../db';
import { settings } from '../../src/db/schema';
import { eq } from 'drizzle-orm';
import auditService from './auditService';
import { requireEnv } from '../config/env';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || '';
const PRIMARY_MODEL = "meta-llama/llama-3.1-8b-instruct";
const FALLBACK_MODEL = "mistralai/mistral-7b-instruct";

export const aiService = {
    /**
     * Core wrapper for OpenRouter requests
     */
    async queryAI(prompt: string, systemPrompt?: string, useFallback = false) {
        if (!OPENROUTER_API_KEY) {
            throw new Error('AI_KEY_MISSING');
        }

        const model = useFallback ? FALLBACK_MODEL : PRIMARY_MODEL;
        const body = {
            model,
            messages: [
                {
                    role: "system",
                    content: systemPrompt || "You are an expert restaurant management consultant. Provide data-driven insights and clear, actionable recommendations."
                },
                { role: "user", content: prompt }
            ],
            temperature: 0.3,
            max_tokens: 1000,
        };

        try {
            const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
                    "HTTP-Referer": "https://restoflow-erp.com",
                    "X-Title": "RestoFlow ERP Backend"
                },
                body: JSON.stringify(body)
            });

            const data = await response.json();

            if (!response.ok) {
                if (response.status === 429) throw new Error('AI_RATE_LIMIT');
                if (!useFallback) return this.queryAI(prompt, systemPrompt, true);
                throw new Error(data.error?.message || `AI_ERROR_${response.status}`);
            }

            return data.choices?.[0]?.message?.content || "";
        } catch (error: any) {
            if (!useFallback && !error.message.includes('AI_KEY_MISSING')) {
                return this.queryAI(prompt, systemPrompt, true);
            }
            throw error;
        }
    },

    /**
     * Get or generate an insight with caching
     */
    async getCachedInsight(cacheKey: string, generator: () => Promise<string>, ttlMinutes = 60) {
        const fullKey = `ai_insight_${cacheKey}`;

        const [cached] = await db.select().from(settings).where(eq(settings.key, fullKey));

        if (cached && cached.updatedAt) {
            const ageMs = Date.now() - new Date(cached.updatedAt).getTime();
            if (ageMs < ttlMinutes * 60 * 1000) {
                return cached.value as string;
            }
        }

        const newValue = await generator();

        const payload = {
            key: fullKey,
            value: newValue,
            category: 'ai_cache',
            updatedAt: new Date(),
        };

        if (cached) {
            await db.update(settings).set(payload).where(eq(settings.key, fullKey));
        } else {
            await db.insert(settings).values(payload as any);
        }

        return newValue;
    },

    /**
     * Log AI action to audit trail
     */
    async logAIAction(userId: string, userName: string, actionType: string, payload: any) {
        await auditService.createSignedAuditLog({
            eventType: `AI_ACTION_${actionType}`,
            userId,
            userName,
            payload,
        });
    }
};
