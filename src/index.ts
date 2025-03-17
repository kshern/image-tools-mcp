#!/usr/bin/env node

import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createServer } from "./server.js";
import { registerAllTools } from "./tools/index.js";
import { createTransport } from "./transport/transportFactory.js";

/**
 * 解析命令行参数
 * 检查是否使用SSE模式
 */
const parseArgs = () => {
  const args = process.argv.slice(2);
  const useSSE = args.includes("--sse");
  const portIndex = args.indexOf("--port");
  const port = portIndex >= 0 && args.length > portIndex + 1 ? parseInt(args[portIndex + 1], 10) : 3000;
  
  return { 
    useSSE, 
    port: isNaN(port) ? 3000 : port 
  };
};

/**
 * 主函数 - 创建并启动MCP服务器
 */
async function main() {
  // 解析命令行参数
  const { useSSE, port } = parseArgs();
  
  // 创建服务器实例
  const server = createServer();
  
  // 注册所有工具
  registerAllTools(server);
  
  // 打印服务器工具信息
  console.log("服务器已注册以下工具:");
  const tools = (server as any)._tools || {};
  Object.keys(tools).forEach(toolName => {
    console.log(`- ${toolName}`);
  });
  
  if (useSSE) {
    console.log("使用SSE传输模式启动服务...");
    // 创建SSE传输（直接在createTransport中连接到服务器）
    createTransport(server, { type: "sse", port });
  } else {
    console.log("使用标准输入/输出传输模式启动服务...");
    // 创建标准输入/输出传输并连接到服务器
    const transport = createTransport(server, { type: "stdio" }) as StdioServerTransport;
    await server.connect(transport);
  }
}

// 启动服务器
main().catch(console.error);
