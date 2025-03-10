#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

// 创建并配置 MCP 服务器
export const createServer = () => {
  const server = new McpServer(
    {
      name: "image-tools-mcp-server",
      version: "0.0.1",
    },
    {
      capabilities: {
        tools: {
          get_image_size: {
            options: z
              .object({
                imageUrl: z.string().describe("Url of the image to retrieve"),
              })
              .describe("Options for retrieving image size"),
          },
          get_local_image_size: {
            options: z
              .object({
                imagePath: z.string().describe("Absolute path to the local image"),
              })
              .describe("Options for retrieving local image size"),
          },
        },
      },
    }
  );

  return server;
};
