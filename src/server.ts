#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
// Import tool function implementations
import {
  getImageSizeFromUrl,
  getLocalImageSize,
  compressImageFromUrl,
  compressLocalImage,
  getFigmaImages,
} from "./tools/index.js";

const token_tools_map = {
  TINIFY_API_KEY: ["compress_image_from_url", "compress_local_image"],
  FIGMA_API_TOKEN: ["get_figma_images"],
};

// 创建一个工具可用性映射，根据环境变量是否存在确定工具是否可用
const getAvailableTools = () => {
  const availableTools = new Set(["get_image_size", "get_local_image_size"]);

  // 检查环境变量并添加对应的工具到可用集合中
  for (const [token, tools] of Object.entries(token_tools_map)) {
    if (process.env[token]) {
      tools.forEach((tool) => availableTools.add(tool));
    }
  }

  return availableTools;
};

// 为工具定义接口类型
interface ToolOptions {
  options: z.ZodTypeAny;
}

// 为capabilities定义类型
interface ToolsCapabilities {
  [key: string]: ToolOptions;
}

// Create and configure MCP server
export const createServer = () => {
  const availableTools = getAvailableTools();

  // 创建动态capabilities对象
  const capabilities: { tools: ToolsCapabilities } = {
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
  };

  // 根据可用工具添加对应的capabilities
  if (availableTools.has("compress_image_from_url")) {
    capabilities.tools.compress_image_from_url = {
      options: z
        .object({
          imageUrl: z
            .string()
            .describe(
              "URL of the image to compress (must be a direct link to an image file)",
            ),
          outputFormat: z
            .enum(["webp", "jpeg", "jpg", "png"])
            .optional()
            .describe("Output format (webp, jpeg/jpg, png)"),
        })
        .describe("Options for compressing image from URL"),
    };
  }

  if (availableTools.has("compress_local_image")) {
    capabilities.tools.compress_local_image = {
      options: z
        .object({
          imagePath: z
            .string()
            .describe(
              "Absolute path to the local image file (must be a file, not a directory)",
            ),
          outputPath: z
            .string()
            .optional()
            .describe("Absolute path for the compressed output image"),
          outputFormat: z
            .enum(["image/webp", "image/jpeg", "image/jpg", "image/png"])
            .optional()
            .describe("Output format (webp, jpeg/jpg, png)"),
        })
        .describe("Options for compressing local image"),
    };
  }

  if (availableTools.has("get_figma_images")) {
    capabilities.tools.get_figma_images = {
      options: z
        .object({
          figmaUrl: z
            .string()
            .describe(
              "Figma design link, e.g. https://www.figma.com/design/fileKey/title?node-id=nodeId",
            ),
          nodeIds: z
            .array(z.string())
            .optional()
            .describe(
              "Optional array of node IDs, if not provided, use the nodeId extracted from the URL",
            ),
          scale: z
            .number()
            .min(0.01)
            .max(4)
            .optional()
            .describe("Optional: image scale, between 0.01 and 4"),
          format: z
            .enum(["jpg", "png", "svg", "pdf"])
            .optional()
            .describe("Optional: image format (jpg, png, svg, pdf)"),
          svg_include_id: z
            .boolean()
            .optional()
            .describe(
              "Optional (SVG only): include id attributes in SVG output",
            ),
          svg_simplify_stroke: z
            .boolean()
            .optional()
            .describe("Optional (SVG only): simplify strokes to outlines"),
          use_absolute_bounds: z
            .boolean()
            .optional()
            .describe("Optional: use absolute bounds for export"),
          version: z
            .string()
            .optional()
            .describe("Optional: a specific version of the file to use"),
        })
        .describe(
          "Options for getting images from Figma API, e.g. https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/imageId",
        ),
    };
  }

  const server = new McpServer(
    {
      name: "image-tools-mcp-server",
      version: "0.0.8", // Use the version from package.json
    },
    {
      capabilities: capabilities,
    },
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
        throw new Error(
          `Failed to get image size: ${(error as Error).message}`,
        );
      }
    },
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
        throw new Error(
          `Failed to get local image size: ${(error as Error).message}`,
        );
      }
    },
  );

  // 根据环境变量有条件地注册工具
  if (availableTools.has("compress_image_from_url")) {
    // Register tool to compress image from URL
    server.tool(
      "compress_image_from_url",
      "Compress a single image from URL using TinyPNG API (only supports image files, not folders)",
      {
        options: z
          .object({
            imageUrl: z
              .string()
              .describe(
                "URL of the image to compress (must be a direct link to an image file)",
              ),
            outputPath: z
              .string()
              .optional()
              .describe("Absolute path for the compressed output image"),
            outputFormat: z
              .enum(["image/webp", "image/jpeg", "image/jpg", "image/png"])
              .optional()
              .describe("Output format (webp, jpeg/jpg, png)"),
          })
          .describe("Options for compressing image from URL"),
      },
      async ({ options = {} }) => {
        try {
          const { imageUrl, outputPath, outputFormat } = options as {
            imageUrl: string;
            outputPath?: string;
            outputFormat?:
              | "image/webp"
              | "image/jpeg"
              | "image/jpg"
              | "image/png";
          };

          // Call tool function implementation
          const result = await compressImageFromUrl(
            imageUrl,
            outputPath,
            outputFormat,
          );

          return {
            content: [
              {
                type: "text" as const,
                text: JSON.stringify(result, null, 2),
              },
            ],
          };
        } catch (error) {
          throw new Error(
            `Failed to compress image: ${(error as Error).message}`,
          );
        }
      },
    );
  }

  if (availableTools.has("compress_local_image")) {
    // Register tool to compress local image
    server.tool(
      "compress_local_image",
      "Compress a single local image file using TinyPNG API (only supports image files, not folders)",
      {
        options: z
          .object({
            imagePath: z
              .string()
              .describe(
                "Absolute path to the local image file (must be a file, not a directory)",
              ),
            outputPath: z
              .string()
              .optional()
              .describe("Absolute path for the compressed output image"),
            outputFormat: z
              .enum(["image/webp", "image/jpeg", "image/jpg", "image/png"])
              .optional()
              .describe("Output format (webp, jpeg/jpg, png)"),
          })
          .describe("Options for compressing local image"),
      },
      async ({ options = {} }) => {
        try {
          const { imagePath, outputPath, outputFormat } = options as {
            imagePath: string;
            outputPath?: string;
            outputFormat?:
              | "image/webp"
              | "image/jpeg"
              | "image/jpg"
              | "image/png";
          };

          // Call tool function implementation
          const result = await compressLocalImage(
            imagePath,
            outputPath,
            outputFormat,
          );

          return {
            content: [
              {
                type: "text" as const,
                text: JSON.stringify(result, null, 2),
              },
            ],
          };
        } catch (error) {
          throw new Error(
            `Failed to compress local image: ${(error as Error).message}`,
          );
        }
      },
    );
  }

  if (availableTools.has("get_figma_images")) {
    // Register tool to get images from Figma API
    server.tool(
      "get_figma_images",
      "Get images from Figma API",
      {
        options: z
          .object({
            figmaUrl: z
              .string()
              .describe(
                "Figma design link, e.g. https://www.figma.com/design/fileKey/title?node-id=nodeId",
              ),
            nodeIds: z
              .array(z.string())
              .optional()
              .describe(
                "Optional array of node IDs, if not provided, use the nodeId extracted from the URL",
              ),
            scale: z
              .number()
              .min(0.01)
              .max(4)
              .optional()
              .describe("Optional: image scale, between 0.01 and 4"),
            format: z
              .enum(["jpg", "png", "svg", "pdf"])
              .optional()
              .describe("Optional: image format (jpg, png, svg, pdf)"),
            svg_include_id: z
              .boolean()
              .optional()
              .describe(
                "Optional (SVG only): include id attributes in SVG output",
              ),
            svg_simplify_stroke: z
              .boolean()
              .optional()
              .describe("Optional (SVG only): simplify strokes to outlines"),
            use_absolute_bounds: z
              .boolean()
              .optional()
              .describe("Optional: use absolute bounds for export"),
            version: z
              .string()
              .optional()
              .describe("Optional: a specific version of the file to use"),
          })
          .describe(
            "Options for getting images from Figma API, e.g. https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/imageId",
          ),
      },
      async ({ options = {} }) => {
        try {
          const {
            figmaUrl,
            nodeIds,
            scale,
            format,
            svg_include_id,
            svg_simplify_stroke,
            use_absolute_bounds,
            version,
          } = options as {
            figmaUrl: string;
            nodeIds?: string[];
            scale?: number;
            format?: "jpg" | "png" | "svg" | "pdf";
            svg_include_id?: boolean;
            svg_simplify_stroke?: boolean;
            use_absolute_bounds?: boolean;
            version?: string;
          };

          // Call tool function implementation
          const result = await getFigmaImages(
            figmaUrl,
            nodeIds,
            scale,
            format,
            svg_include_id,
            svg_simplify_stroke,
            use_absolute_bounds,
            version,
          );

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
          throw new Error(
            `Failed to get Figma images: ${(error as Error).message}`,
          );
        }
      },
    );
  }

  return server;
};
