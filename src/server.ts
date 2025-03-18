#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
// 导入 package.json 中的版本信息
import packageJson from "../package.json" with { type: "json" };

// 创建并配置 MCP 服务器
export const createServer = () => {
  const server = new McpServer(
    {
      name: "image-tools-mcp-server",
      version: packageJson.version, // 使用 package.json 中的版本号
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
          compress_image_from_url: {
            options: z
              .object({
                imageUrl: z.string().describe("URL of the image to compress (must be a direct link to an image file)"),
                outputFormat: z.enum(["webp", "jpeg", "jpg", "png"]).optional().describe("Output format (webp, jpeg/jpg, png)"),
              })
              .describe("Options for compressing image from URL"),
          },
          compress_local_image: {
            options: z
              .object({
                imagePath: z.string().describe("Absolute path to the local image file (must be a file, not a directory)"),
                outputPath: z.string().optional().describe("Absolute path for the compressed output image"),
                outputFormat: z.enum(["image/webp", "image/jpeg", "image/jpg", "image/png"]).optional().describe("Output format (webp, jpeg/jpg, png)"),
              })
              .describe("Options for compressing local image"),
          },
        },
      },
    }
  );

  return server;
};
