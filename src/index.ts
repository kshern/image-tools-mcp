#!/usr/bin/env node

import {
  McpServer
} from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import probe from "probe-image-size";
import fs from "fs";

const server = new McpServer(
  {
    name: "image-size-mcp-server",
    version: "1.0.0",
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

server.tool(
  "get_image_size",
  "Get the size of an image from URL",
  {
    options: z
      .object({
        imageUrl: z.string().describe("Url of the image to retrieve"),
      })
      .describe("Options for retrieving image size"),
  },
  async ({ options = {} }) => {
    try {
      const { imageUrl } = options as { imageUrl: string };

      // Get image dimensions from URL
      const imageInfo = await probe(imageUrl);
      const result = {
        width: imageInfo.width,
        height: imageInfo.height,
        type: imageInfo.type,
        mime: imageInfo.mime,
      };

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to get image size: ${(error as Error).message}`);
    }
  }
);

server.tool(
  "get_local_image_size",
  "Get the size of a local image",
  {
    options: z
      .object({
        imagePath: z.string().describe("Absolute path to the local image"),
      })
      .describe("Options for retrieving local image size"),
  },
  async ({ options = {} }) => {
    try {
      const { imagePath } = options as { imagePath: string };

      // Check if file exists
      if (!fs.existsSync(imagePath)) {
        throw new Error(`File does not exist: ${imagePath}`);
      }

      // Method 1: Using Buffer (synchronous)
      const imageBuffer = fs.readFileSync(imagePath);
      const result = probe.sync(imageBuffer);

      if (!result) {
        throw new Error(`Unable to recognize image format: ${imagePath}`);
      }

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({
              width: result.width,
              height: result.height,
              type: result.type,
              mime: result.mime,
              path: imagePath,
            }, null, 2),
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to get local image size: ${(error as Error).message}`);
    }
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch(console.error);
