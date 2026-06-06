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

export const getAccountsSchema = z.object({
  provider: providerSchema,
  externalUserId: z.string().min(1).max(200),
});

export const getCapabilitiesSchema = z.object({});

export const accountSetupProposalSchema = z.object({
  provider: providerSchema,
  externalUserId: z.string().min(1).max(200),
  accounts: z.array(z.object({
    name: z.string().min(1).max(100),
    type: z.enum(['CASH', 'CHECKING', 'SAVINGS', 'CREDIT']),
    openingBalance: z.union([z.string(), z.number()]).default('0'),
    currency: z.string().default('USD'),
  })),
  sourceText: z.string().max(1000).optional(),
});

export const createRecurringRuleProposalSchema = z.object({
  provider: providerSchema,
  externalUserId: z.string().min(1).max(200),
  accountId: z.string().min(1),
  categoryId: z.string().min(1),
  amount: z.union([z.string(), z.number()]),
  type: z.enum(['INCOME', 'EXPENSE']),
  cadence: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY']),
  interval: z.number().int().min(1).default(1),
  startDate: z.string().datetime(),
  note: z.string().max(500).optional(),
  sourceText: z.string().max(1000).optional(),
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

export async function getAccounts(apiClient: FinanceTrackerApiClient, input: unknown): Promise<unknown> {
  const parsed = getAccountsSchema.parse(input);
  const query = new URLSearchParams({
    provider: parsed.provider,
    externalUserId: parsed.externalUserId,
  }).toString();
  return apiClient.get(`/api/accounts?${query}`);
}

export async function getMarbotCapabilities(apiClient: FinanceTrackerApiClient, input: unknown): Promise<unknown> {
  getCapabilitiesSchema.parse(input); // Validate empty input
  return {
    capabilities: [
      { name: 'redeem_claw_link_code', description: 'Redeem a link code to connect WhatsApp to FinTrack' },
      { name: 'create_transaction_proposal', description: 'Create a transaction proposal for review' },
      { name: 'handle_claw_text_command', description: 'Handle free-form text commands' },
      { name: 'get_accounts', description: 'Get a list of linked FinTrack accounts' },
      { name: 'get_marbot_capabilities', description: 'List available FinTrack Mar Bot capabilities' },
      { name: 'create_account_proposal', description: 'Create an account setup proposal' },
      { name: 'create_recurring_rule_proposal', description: 'Create a recurring rule proposal' },
    ],
  };
}

export async function createAccountProposal(apiClient: FinanceTrackerApiClient, input: unknown): Promise<unknown> {
  const parsed = accountSetupProposalSchema.parse(input);
  return apiClient.post('/api/claw/service/proposals/account-setup', parsed);
}

export async function createRecurringRuleProposal(apiClient: FinanceTrackerApiClient, input: unknown): Promise<unknown> {
  const parsed = createRecurringRuleProposalSchema.parse(input);
  return apiClient.post('/api/claw/service/proposals/recurring-rule', parsed);
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

  router.post('/get_accounts', async (req, res, next) => {
    try {
      const result = await getAccounts(apiClient, req.body);
      res.json(result);
    } catch (err) {
      next(err);
    }
  });

  router.post('/get_marbot_capabilities', async (req, res, next) => {
    try {
      const result = await getMarbotCapabilities(apiClient, req.body);
      res.json(result);
    } catch (err) {
      next(err);
    }
  });

  router.post('/create_account_proposal', async (req, res, next) => {
    try {
      const result = await createAccountProposal(apiClient, req.body);
      res.json(result);
    } catch (err) {
      next(err);
    }
  });

  router.post('/create_recurring_rule_proposal', async (req, res, next) => {
    try {
      const result = await createRecurringRuleProposal(apiClient, req.body);
      res.json(result);
    } catch (err) {
      next(err);
    }
  });

  return router;
}
