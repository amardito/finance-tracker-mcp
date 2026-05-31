import { Router, type Router as RouterT } from 'express';
import { FinanceTrackerApiClient, type ApiRequestContext } from '../api-client.js';

export function createReadResourcesRouter(apiClient: FinanceTrackerApiClient): RouterT {
  const router = Router();

  router.use((req, res, next) => {
    const context = scopedContext(req.headers.cookie);
    if (!context) {
      res.status(401).json({
        error: {
          code: 'SCOPED_CONTEXT_REQUIRED',
          message: 'MCP read resources require an authenticated scoped context',
        },
      });
      return;
    }
    res.locals.apiContext = context;
    next();
  });

  router.get('/accounts', async (_req, res, next) => {
    try {
      const accounts = await apiClient.get<unknown[]>('/api/accounts', res.locals.apiContext);
      res.json({
        items: accounts.map((account) => pick(account, ['id', 'name', 'type', 'balance', 'currency', 'archivedAt'])),
      });
    } catch (err) {
      next(err);
    }
  });

  router.get('/categories', async (_req, res, next) => {
    try {
      const categories = await apiClient.get<unknown[]>('/api/categories', res.locals.apiContext);
      res.json({ items: categories.map((category) => pick(category, ['id', 'name', 'type', 'color', 'parentId'])) });
    } catch (err) {
      next(err);
    }
  });

  router.get('/tags', async (_req, res, next) => {
    try {
      const tags = await apiClient.get<unknown[]>('/api/tags', res.locals.apiContext);
      res.json({ items: tags.map((tag) => pick(tag, ['id', 'name', 'color'])) });
    } catch (err) {
      next(err);
    }
  });

  router.get('/budgets/progress', async (_req, res, next) => {
    try {
      const budgets = await apiClient.get<unknown[]>('/api/budgets/progress', res.locals.apiContext);
      res.json({
        items: budgets.map((budget) =>
          pick(budget, ['id', 'categoryId', 'period', 'amount', 'spent', 'remaining', 'ratio', 'status']),
        ),
      });
    } catch (err) {
      next(err);
    }
  });

  router.get('/goals/active', async (_req, res, next) => {
    try {
      const goals = await apiClient.get<unknown[]>('/api/goals', res.locals.apiContext);
      res.json({
        items: goals
          .filter((goal) => isRecord(goal) && goal.status === 'ACTIVE')
          .map((goal) => pick(goal, ['id', 'name', 'targetAmount', 'currentAmount', 'deadline', 'status'])),
      });
    } catch (err) {
      next(err);
    }
  });

  router.get('/transactions/recent', async (_req, res, next) => {
    try {
      const result = await apiClient.get<{ items?: unknown[] }>('/api/transactions?limit=10', res.locals.apiContext);
      res.json({
        items: (result.items ?? []).map((transaction) =>
          pick(transaction, ['id', 'accountId', 'categoryId', 'amount', 'type', 'date', 'note']),
        ),
      });
    } catch (err) {
      next(err);
    }
  });

  router.get('/reports/month-summary', async (_req, res, next) => {
    try {
      const summary = await apiClient.get<unknown>('/api/reports/summary', res.locals.apiContext);
      res.json(pick(summary, ['from', 'to', 'income', 'expense', 'net', 'netWorth', 'transactionCount']));
    } catch (err) {
      next(err);
    }
  });

  return router;
}

function scopedContext(cookie: string | undefined): ApiRequestContext | null {
  if (!cookie) return null;
  return { cookie };
}

function pick(value: unknown, keys: string[]): Record<string, unknown> {
  if (!isRecord(value)) return {};
  return Object.fromEntries(keys.map((key) => [key, value[key]]).filter(([, item]) => item !== undefined));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
