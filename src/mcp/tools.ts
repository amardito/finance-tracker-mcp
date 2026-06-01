import { Router, type Router as RouterT } from 'express';
import { z } from 'zod';
import { FinanceTrackerApiClient } from '../api-client.js';
import { requireServiceAuth } from '../service-auth.js';

const providerSchema = z.enum(['NANOBOT_WHATSAPP']).default('NANOBOT_WHATSAPP');

export const redeemLinkCodeSchema = z.object({
  code: z.string().min(6).max(64),
  provider: providerSchema,
  externalUserId: z.string().min(1).max(200),
  displayName: z.string().max(200).optional(),
});

export const transactionProposalSchema = z.object({
  provider: providerSchema,
  externalUserId: z.string().min(1).max(200),
  accountId: z.string().min(1),
  categoryId: z.string().min(1),
  amount: z.union([z.string(), z.number()]),
  type: z.enum(['INCOME', 'EXPENSE']),
  date: z.string().datetime().optional(),
  note: z.string().max(500).optional(),
  tagIds: z.array(z.string().min(1)).optional(),
  sourceText: z.string().max(1000).optional(),
  confidence: z.number().min(0).max(1).default(0.8),
});

export const commandSchema = z.object({
  provider: providerSchema,
  externalUserId: z.string().min(1).max(200),
  text: z.string().min(1).max(1000),
  messageId: z.string().max(200).optional(),
});

export async function redeemClawLinkCode(apiClient: FinanceTrackerApiClient, input: unknown): Promise<unknown> {
  const parsed = redeemLinkCodeSchema.parse(input);
  return apiClient.post('/api/claw/service/link-codes/redeem', parsed);
}

export async function createTransactionProposal(apiClient: FinanceTrackerApiClient, input: unknown): Promise<unknown> {
  const parsed = transactionProposalSchema.parse(input);
  return apiClient.post('/api/claw/service/proposals/transaction', parsed);
}

export async function handleClawTextCommand(apiClient: FinanceTrackerApiClient, input: unknown): Promise<unknown> {
  const parsed = commandSchema.parse(input);
  return apiClient.post('/api/claw/service/commands', parsed);
}

export function createToolsRouter(apiClient: FinanceTrackerApiClient): RouterT {
  const router = Router();
  router.use(requireServiceAuth);

  router.post('/redeem_claw_link_code', async (req, res, next) => {
    try {
      const result = await redeemClawLinkCode(apiClient, req.body);
      res.json(result);
    } catch (err) {
      next(err);
    }
  });

  router.post('/create_transaction_proposal', async (req, res, next) => {
    try {
      const result = await createTransactionProposal(apiClient, req.body);
      res.json(result);
    } catch (err) {
      next(err);
    }
  });

  router.post('/handle_claw_text_command', async (req, res, next) => {
    try {
      const result = await handleClawTextCommand(apiClient, req.body);
      res.json(result);
    } catch (err) {
      next(err);
    }
  });

  return router;
}
