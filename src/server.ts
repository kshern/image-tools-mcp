#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
// Import version information from package.json
import packageJson from "../package.json" with { type: "json" };
// Import tool function implementations
import { getImageSizeFromUrl, getLocalImageSize, compressImageFromUrl, compressLocalImage, getFigmaImages } from "./tools/index.js";

// Create and configure MCP server
export const createServer = () => {
  const server = new McpServer(
    {
      name: "image-tools-mcp-server",
      version: packageJson.version, // Use the version from package.json
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
          get_figma_images: {
            options: z
              .object({
                figmaUrl: z.string().describe("Figma design link, e.g. https://www.figma.com/design/fileKey/title?node-id=nodeId"),
                nodeIds: z.array(z.string()).optional().describe("Optional array of node IDs, if not provided, use the nodeId extracted from the URL"),
              })
              .describe("Options for getting images from Figma API"),
          },
        },
      },
    }
  );

  // Register tool to get image size from URL
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
        // Call tool function implementation
        const result = await getImageSizeFromUrl(imageUrl);
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

  // Register tool to get local image size
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
        // Call tool function implementation
        const result = await getLocalImageSize(imagePath);
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error) {
        throw new Error(`Failed to get local image size: ${(error as Error).message}`);
      }
    }
  );

  // Register tool to compress image from URL
  server.tool(
    "compress_image_from_url",
    "Compress a single image from URL using TinyPNG API (only supports image files, not folders)",
    {
      options: z
        .object({
          imageUrl: z.string().describe("URL of the image to compress (must be a direct link to an image file)"),
          outputPath: z.string().optional().describe("Absolute path for the compressed output image"),
          outputFormat: z.enum(["image/webp", "image/jpeg", "image/jpg", "image/png"]).optional().describe("Output format (webp, jpeg/jpg, png)"),
        })
        .describe("Options for compressing image from URL"),
    },
    async ({ options = {} }) => {
      try {
        const { imageUrl, outputPath, outputFormat } = options as { 
          imageUrl: string;
          outputPath?: string;
          outputFormat?: "image/webp" | "image/jpeg" | "image/jpg" | "image/png";
        };
        
        // Call tool function implementation
        const result = await compressImageFromUrl(imageUrl, outputPath, outputFormat);
        
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error) {
        throw new Error(`Failed to compress image: ${(error as Error).message}`);
      }
    }
  );

  // Register tool to compress local image
  server.tool(
    "compress_local_image",
    "Compress a single local image file using TinyPNG API (only supports image files, not folders)",
    {
      options: z
        .object({
          imagePath: z.string().describe("Absolute path to the local image file (must be a file, not a directory)"),
          outputPath: z.string().optional().describe("Absolute path for the compressed output image"),
          outputFormat: z.enum(["image/webp", "image/jpeg", "image/jpg", "image/png"]).optional().describe("Output format (webp, jpeg/jpg, png)"),
        })
        .describe("Options for compressing local image"),
    },
    async ({ options = {} }) => {
      try {
        const { imagePath, outputPath, outputFormat } = options as { 
          imagePath: string;
          outputPath?: string;
          outputFormat?: "image/webp" | "image/jpeg" | "image/jpg" | "image/png";
        };
        
        // Call tool function implementation
        const result = await compressLocalImage(imagePath, outputPath, outputFormat);
        
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error) {
        throw new Error(`Failed to compress local image: ${(error as Error).message}`);
      }
    }
  );
  
  // Register tool to get images from Figma API
  server.tool(
    "get_figma_images",
    "Get images from Figma API and compress them using TinyPNG API",
    {
      options: z
        .object({
          figmaUrl: z.string().describe("Figma design link, e.g. https://www.figma.com/design/fileKey/title?node-id=nodeId"),
          nodeIds: z.array(z.string()).optional().describe("Optional array of node IDs, if not provided, use the nodeId extracted from the URL"),
        })
        .describe("Options for getting images from Figma API"),
    },
    async ({ options = {} }) => {
      try {
        const { figmaUrl, nodeIds } = options as { 
          figmaUrl: string;
          nodeIds?: string[];
        };
        
        // Call tool function implementation
        const result = await getFigmaImages(figmaUrl, nodeIds);
        
        // Check if there is an error
        if (result.err) {
          throw new Error(result.err);
        }
        
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error) {
        throw new Error(`Failed to get Figma images: ${(error as Error).message}`);
      }
    }
  );

  return server;
};
