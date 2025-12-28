
import { OpenAI } from 'openai';
import dotenv from 'dotenv';
import express, { Router, Request, Response } from 'express';

dotenv.config();

export class AIService {
    private openai: OpenAI | null = null;
    private router: Router;

    constructor() {
        this.router = Router();
        this.initialize();
        this.setupRoutes();
    }

    private initialize() {
        const apiKey = process.env.OPENAI_API_KEY;
        if (apiKey) {
            this.openai = new OpenAI({ apiKey });
            console.log("✅ OpenAI Service Initialized");
        } else {
            console.warn("⚠️ OpenAI Service: OPENAI_API_KEY not found in .env. AI features will be disabled.");
        }
    }

    private setupRoutes() {
        // Generate Smart Contract
        this.router.post('/generate-contract', async (req: Request, res: Response) => {
            if (!this.openai) {
                return res.status(503).json({ error: 'OpenAI service not configured on server.' });
            }

            const { prompt } = req.body;
            if (!prompt) return res.status(400).json({ error: 'Prompt is required' });

            try {
                const completion = await this.openai.chat.completions.create({
                    messages: [
                        { role: "system", content: "You are an expert Solidity developer. Generate a clean, secure, and commented Solidity Smart Contract based on the user's request. Return ONLY the code, starting with 'pragma solidity ^0.8.0;' and ending with the closing brace. Do not include markdown formatting or backticks." },
                        { role: "user", content: prompt }
                    ],
                    model: "gpt-3.5-turbo",
                });

                const code = completion.choices[0].message.content;
                res.json({ code });
            } catch (error: any) {
                console.error("OpenAI Error:", error);
                res.status(500).json({ error: error.message || 'Failed to generate contract' });
            }
        });

        // Audit Smart Contract
        this.router.post('/audit-contract', async (req: Request, res: Response) => {
            if (!this.openai) {
                return res.status(503).json({ error: 'OpenAI service not configured on server.' });
            }

            const { code } = req.body;
            if (!code) return res.status(400).json({ error: 'Code is required' });

            try {
                const completion = await this.openai.chat.completions.create({
                    messages: [
                        { role: "system", content: "You are an expert Smart Contract Auditor. Analyze the provided Solidity code for security vulnerabilities, optimizations, and logic errors. Provide a concise report with a score out of 10." },
                        { role: "user", content: `Audit this contract:\n\n${code}` }
                    ],
                    model: "gpt-3.5-turbo",
                });

                const audit = completion.choices[0].message.content;
                res.json({ audit });
            } catch (error: any) {
                console.error("OpenAI Error:", error);
                res.status(500).json({ error: error.message || 'Failed to audit contract' });
            }
        });

        // Explain Transaction
        this.router.post('/explain-tx', async (req: Request, res: Response) => {
            // Placeholder for transaction explanation
            if (!this.openai) {
                return res.status(503).json({ error: 'OpenAI service not configured on server.' });
            }
            res.status(501).json({ error: 'Not implemented yet' });
        });
    }

    public getRouter(): Router {
        return this.router;
    }
}
