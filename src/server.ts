#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

/**
 * 创建并配置 MCP 服务器
 * @returns 配置好的 MCP 服务器实例
 */
export const createServer = () => {
  // 创建一个新的 MCP 服务器实例
  const server = new McpServer({
    name: "image-tools-mcp-server",
    version: "0.0.1",
  });

  return server;
};
