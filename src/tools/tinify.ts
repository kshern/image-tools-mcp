import { z } from "zod";
import tinify from "tinify";
import fs from "fs";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import path from "path";
/**
 * 设置TinyPNG API密钥
 * @param apiKey 可选的API密钥，如果未提供则从环境变量获取
 * @throws 如果API密钥未设置则抛出错误
 */
const setTinifyApiKey = (apiKey?: string) => {
  // 优先使用传入的API密钥，其次从环境变量获取
  const key = apiKey || process.env.TINIFY_API_KEY;
  if (!key) {
    throw new Error("TINIFY_API_KEY is not provided and environment variable is not set");
  }
  tinify.key = key;
};

// 从URL压缩图片的工具函数
export const registerCompressImageFromUrlTool = (server: McpServer) => {
  server.tool(
    "compress_image_from_url",
    "Compress a single image from URL using TinyPNG API (only supports image files, not folders)",
    {
      options: z
        .object({
          imageUrl: z.string().describe("URL of the image to compress (must be a direct link to an image file)"),
          outputFormat: z.enum(["webp", "jpeg", "jpg", "png"]).optional().describe("Output format (webp, jpeg/jpg, png)"),
          apiKey: z.string().optional().describe("TinyPNG API key (optional if set in environment variables)"),
        })
        .describe("Options for compressing image from URL"),
    },
    async ({ options = {} }) => {
      try {
        const { imageUrl, outputFormat, apiKey } = options as { 
          imageUrl: string;
          outputFormat?: "image/webp" | "image/jpeg" | "image/jpg" | "image/png";
          apiKey?: string;
        };

        // 设置API密钥
        setTinifyApiKey(apiKey);

        // 从URL获取图片并压缩
        let source = tinify.fromUrl(imageUrl);

        // 如果指定了输出格式，则转换格式
        if (outputFormat) {
          // 使用类型断言来避免类型错误
          const convertOptions = { type: outputFormat === "image/jpg" ? "image/jpeg" : outputFormat };
          source = source.convert(convertOptions as any);
        }

        // 获取压缩后的图片数据
        const data = await new Promise<Buffer>((resolve, reject) => {
          source.toBuffer((err: any, data: any) => {
            if (err) reject(err);
            else if (data) resolve(Buffer.from(data));
            else reject(new Error('No data returned from tinify'));
          });
        });

        // 将图片数据转换为Base64
        const base64Data = data.toString("base64");

        // 确定MIME类型
        let mimeType = "image/jpeg"; // 默认MIME类型
        if (outputFormat) {
          mimeType = `image/${outputFormat === "image/jpg" ? "jpeg" : outputFormat}`;
        }

        return {
          content: [
            {
              type: "image" as const,
              data: base64Data,
              mimeType,
            },
            {
              type: "text" as const,
              text: JSON.stringify({
                originalSize: "Unknown (from URL)",
                compressedSize: data.length,
                format: outputFormat || "Unknown",
              }, null, 2),
            },
          ],
        };
      } catch (error) {
        throw new Error(`Failed to compress image from URL: ${(error as Error).message}`);
      }
    }
  );
};

// 从本地文件压缩图片的工具函数
export const registerCompressLocalImageTool = (server: McpServer) => {
  server.tool(
    "compress_local_image",
    "Compress a single local image file using TinyPNG API (only supports image files, not folders)",
    {
      options: z
        .object({
          imagePath: z.string().describe("Absolute path to the local image file (must be a file, not a directory)"),
          outputPath: z.string().optional().describe("Absolute path for the compressed output image"),
          outputFormat: z.enum(["webp", "jpeg", "jpg", "png"]).optional().describe("Output format (webp, jpeg/jpg, png)"),
          apiKey: z.string().optional().describe("TinyPNG API key (optional if set in environment variables)"),
        })
        .describe("Options for compressing local image"),
    },
    async ({ options = {} }) => {
      try {
        const { imagePath, outputPath, outputFormat, apiKey } = options as { 
          imagePath: string;
          outputPath?: string;
          outputFormat?: "webp" | "jpeg" | "jpg" | "png";
          apiKey?: string;
        };

        // 设置API密钥
        setTinifyApiKey(apiKey);

        // 检查文件是否存在
        if (!fs.existsSync(imagePath)) {
          throw new Error(`File does not exist: ${imagePath}`);
        }

        // 获取原始文件大小
        const originalSize = fs.statSync(imagePath).size;

        // 从本地文件压缩图片
        let source = tinify.fromFile(imagePath);

        // 如果指定了输出格式，则转换格式
        if (outputFormat) {
          // 将输出格式转换为tinify需要的格式
          const format = outputFormat === "jpg" ? "jpeg" : outputFormat;
          // 使用类型断言处理类型不匹配的问题
          source = source.convert({ type: format as any });
        }

        // 确定输出路径
        let finalOutputPath = outputPath;
        if (!finalOutputPath) {
          const dir = path.dirname(imagePath);
          const ext = outputFormat || path.extname(imagePath).slice(1) || "jpg";
          const basename = path.basename(imagePath, path.extname(imagePath));
          finalOutputPath = path.join(dir, `${basename}_compressed.${ext}`);
        }

        // 保存压缩后的图片
        await new Promise<void>((resolve, reject) => {
          source.toFile(finalOutputPath, function(err: any) {
            if (err) reject(err);
            else resolve();
          });
        });

        // 获取压缩后的文件大小
        const compressedSize = fs.statSync(finalOutputPath).size;
        const compressionRatio = ((1 - compressedSize / originalSize) * 100).toFixed(2);

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify({
                originalSize,
                compressedSize,
                compressionRatio: `${compressionRatio}%`,
                outputPath: finalOutputPath,
                format: outputFormat || path.extname(finalOutputPath).slice(1),
              }, null, 2),
            },
          ],
        };
      } catch (error) {
        throw new Error(`Failed to compress local image: ${(error as Error).message}`);
      }
    }
  );
};
