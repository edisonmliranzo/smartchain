
import express, { Router, Request, Response } from 'express';
// @ts-ignore
import solc from 'solc';

export class CompilerService {
    private router: Router;

    constructor() {
        this.router = Router();
        this.setupRoutes();
    }

    private setupRoutes() {
        this.router.post('/compile', async (req: Request, res: Response) => {
            const { sourceCode } = req.body;

            if (!sourceCode) {
                return res.status(400).json({ error: 'Source code is required' });
            }

            try {
                const input = {
                    language: 'Solidity',
                    sources: {
                        'Contract.sol': {
                            content: sourceCode,
                        },
                    },
                    settings: {
                        outputSelection: {
                            '*': {
                                '*': ['abi', 'evm.bytecode'],
                            },
                        },
                    },
                };

                const output = JSON.parse(solc.compile(JSON.stringify(input)));

                if (output.errors) {
                    const errors = output.errors.filter((err: any) => err.severity === 'error');
                    if (errors.length > 0) {
                        return res.status(400).json({
                            error: 'Compilation failed',
                            details: errors.map((e: any) => e.formattedMessage || e.message)
                        });
                    }
                }

                // Extract ABI and Bytecode for the first contract found
                const contractFile = output.contracts['Contract.sol'];
                const contractName = Object.keys(contractFile)[0];
                const contract = contractFile[contractName];

                res.json({
                    name: contractName,
                    abi: contract.abi,
                    bytecode: contract.evm.bytecode.object,
                });

            } catch (error: any) {
                console.error("Compilation Error:", error);
                res.status(500).json({ error: error.message || 'Compilation failed' });
            }
        });
    }

    public getRouter(): Router {
        return this.router;
    }
}
