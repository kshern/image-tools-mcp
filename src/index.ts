#!/usr/bin/env node

import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createServer } from "./server.js";
import { registerAllTools } from "./tools/index.js";

/**
 * 主函数 - 创建并启动MCP服务器
 */
async function main() {
  // 创建服务器实例
  const server = createServer();
  
  // 注册所有工具
  registerAllTools(server);
  
  // 连接到标准输入/输出传输
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

// 启动服务器
main().catch(console.error);
