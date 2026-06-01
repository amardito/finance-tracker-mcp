import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { Router, type Router as RouterT } from 'express';
import { FinanceTrackerApiClient } from '../api-client.js';
import { requireServiceAuth } from '../service-auth.js';
import {
  commandSchema,
  createTransactionProposal,
  handleClawTextCommand,
  redeemClawLinkCode,
  redeemLinkCodeSchema,
  transactionProposalSchema,
} from './tools.js';

export function createMcpProtocolRouter(apiClient: FinanceTrackerApiClient): RouterT {
  const router = Router();

  router.post('/', requireServiceAuth, async (req, res) => {
    const server = createFinTrackMcpServer(apiClient);
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
    });

    try {
      await server.connect(transport);
      await transport.handleRequest(req, res, req.body);
    } catch (err) {
      req.log?.error({ err }, 'MCP protocol request failed');
      if (!res.headersSent) {
        res.status(500).json({
          jsonrpc: '2.0',
          error: {
            code: -32603,
            message: 'Internal server error',
          },
          id: null,
        });
      }
    } finally {
      await transport.close();
      await server.close();
    }
  });

  router.get('/', (_req, res) => {
    res.status(405).json({
      jsonrpc: '2.0',
      error: {
        code: -32000,
        message: 'Method not allowed',
      },
      id: null,
    });
  });

  router.delete('/', (_req, res) => {
    res.status(405).json({
      jsonrpc: '2.0',
      error: {
        code: -32000,
        message: 'Method not allowed',
      },
      id: null,
    });
  });

  return router;
}

function createFinTrackMcpServer(apiClient: FinanceTrackerApiClient): McpServer {
  const server = new McpServer({
    name: 'finance-tracker-mcp',
    version: '0.1.0',
  });

  server.registerTool(
    'redeem_claw_link_code',
    {
      title: 'Redeem WhatsApp Link Code',
      description: 'Links a NanoBot WhatsApp identity to a FinTrack account using a one-time link code.',
      inputSchema: redeemLinkCodeSchema.shape,
    },
    async (input) => jsonToolResult(await redeemClawLinkCode(apiClient, input)),
  );

  server.registerTool(
    'create_transaction_proposal',
    {
      title: 'Create Transaction Proposal',
      description: 'Creates a supervised FinTrack transaction proposal for the linked user.',
      inputSchema: transactionProposalSchema.shape,
    },
    async (input) => jsonToolResult(await createTransactionProposal(apiClient, input)),
  );

  server.registerTool(
    'handle_claw_text_command',
    {
      title: 'Handle FinTrack Text Command',
      description: 'Processes a natural-language FinTrack command for the linked WhatsApp identity.',
      inputSchema: commandSchema.shape,
    },
    async (input) => jsonToolResult(await handleClawTextCommand(apiClient, input)),
  );

  return server;
}

function jsonToolResult(value: unknown) {
  return {
    content: [
      {
        type: 'text' as const,
        text: JSON.stringify(value, null, 2),
      },
    ],
  };
}
