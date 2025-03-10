import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerGetImageSizeTool, registerGetLocalImageSizeTool } from "./imageSize.js";

// 注册所有工具函数
export const registerAllTools = (server: McpServer) => {
  registerGetImageSizeTool(server);
  registerGetLocalImageSizeTool(server);
};
