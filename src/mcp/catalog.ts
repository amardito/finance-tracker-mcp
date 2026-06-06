export const mcpResources = [
  'finance://accounts',
  'finance://categories',
  'finance://tags',
  'finance://budgets/progress',
  'finance://goals/active',
  'finance://transactions/recent',
  'finance://reports/month-summary',
] as const;

export const mcpTools = [
  'get_setup_templates',
  'get_marbot_capabilities',
  'get_accounts',
  'get_categories',
  'get_recent_transactions',
  'get_budget_progress',
  'get_goal_status',
  'get_cashflow_summary',
  'create_setup_proposal',
  'create_account_proposal',
  'create_recurring_rule_proposal',
  'create_transaction_proposal',
  'redeem_claw_link_code',
  'handle_claw_text_command',
  'create_transaction_from_receipt_proposal',
  'create_account_transfer_proposal',
  'create_budget_proposal',
  'create_goal_proposal',
  'create_recurring_rule_proposal',
] as const;

export function getCatalog() {
  return {
    resources: mcpResources,
    tools: mcpTools,
    safety: {
      apiIsSystemOfRecord: true,
      directDatabaseAccess: false,
      rawAccountTokenStorage: false,
    },
  };
}
