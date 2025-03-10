import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerGetImageSizeTool, registerGetLocalImageSizeTool } from "./imageSize.js";
import { registerCompressImageFromUrlTool, registerCompressLocalImageTool } from "./tinify.js";

// 注册所有工具函数
export const registerAllTools = (server: McpServer) => {
  registerGetImageSizeTool(server);
  registerGetLocalImageSizeTool(server);
  registerCompressImageFromUrlTool(server);
  registerCompressLocalImageTool(server);
};
