import fetch from "node-fetch";

/**
 * 从 Figma URL 中提取 fileKey 和 nodeId
 * @param figmaUrl - Figma 设计链接
 * @returns 包含 fileKey 和 nodeId 的对象
 */
export function extractFigmaParams(figmaUrl: string): {
  fileKey: string;
  nodeId: string;
} {
  // 支持两种格式的 URL:
  // 1. https://www.figma.com/file/fileKey/title
  // 2. https://www.figma.com/design/fileKey/title?node-id=nodeId

  let fileKey = "";
  let nodeId = "";

  try {
    const url = new URL(figmaUrl);

    // 从路径中提取 fileKey
    const pathParts = url.pathname.split("/");
    if (pathParts.length >= 3) {
      // 路径格式为 /file/fileKey/title 或 /design/fileKey/title
      fileKey = pathParts[2];
    }

    // 从查询参数中提取 nodeId
    const nodeIdParam = url.searchParams.get("node-id");
    if (nodeIdParam) {
      nodeId = nodeIdParam;
    }

    if (!fileKey) {
      throw new Error("无法从 URL 中提取 fileKey");
    }

    return { fileKey, nodeId };
  } catch (error) {
    throw new Error(`解析 Figma URL 失败: ${(error as Error).message}`);
  }
}

/**
 * 从 Figma API 获取图片信息
 * @param figmaUrl - Figma 设计链接
 * @param nodeIds - 可选的节点 ID 数组，如果不提供则使用从 URL 中提取的 nodeId
 * @returns 包含图片 URL 的对象
 */
export async function getFigmaImages(
  figmaUrl: string,
  nodeIds?: string[],
): Promise<{ images: Record<string, string | null>; err?: string }> {
  try {
    // 从 URL 中提取参数
    const { fileKey, nodeId } = extractFigmaParams(figmaUrl);
    const figmaToken = process.env.FIGMA_API_TOKEN;
    if (!figmaToken) {
      throw new Error("FIGMA_API_TOKEN 环境变量未设置");
    }

    // 确定要请求的节点 ID
    const idsToFetch = nodeIds || (nodeId ? [nodeId] : []);

    if (idsToFetch.length === 0) {
      throw new Error("未提供节点 ID，无法获取图片");
    }

    // 构建 API URL
    const apiUrl = `https://api.figma.com/v1/images/${fileKey}?ids=${idsToFetch.join(
      ",",
    )}`;

    // 发起请求
    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        "X-FIGMA-TOKEN": figmaToken,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Figma API 请求失败 (${response.status}): ${errorText}`);
    }

    // 解析响应
    const data = (await response.json()) as {
      images: Record<string, string | null>;
      err?: string;
    };
    return data;
  } catch (error) {
    console.error("获取 Figma 图片失败:", error);
    return {
      images: {},
      err: `获取 Figma 图片失败: ${(error as Error).message}`,
    };
  }
}

/**
 * 下载 Figma 图片到本地
 * @param imageUrl - Figma 图片 URL
 * @param outputPath - 输出文件路径
 * @returns 包含下载结果的对象
 */
export async function downloadFigmaImage(
  imageUrl: string,
  outputPath: string,
): Promise<{ success: boolean; path?: string; error?: string }> {
  try {
    const fs = await import("fs");
    const { finished } = await import("stream/promises");

    // 发起请求获取图片
    const response = await fetch(imageUrl);

    if (!response.ok) {
      throw new Error(`下载图片失败: HTTP ${response.status}`);
    }

    // 创建写入流
    const fileStream = fs.createWriteStream(outputPath);

    // 将响应体作为流传输到文件
    // 使用 unknown 作为中间类型，避免类型错误
    const buffer = Buffer.from(await response.arrayBuffer());
    const readableStream = (await import("stream")).Readable.from(buffer);
    await finished(readableStream.pipe(fileStream));

    return {
      success: true,
      path: outputPath,
    };
  } catch (error) {
    console.error("下载 Figma 图片失败:", error);
    return {
      success: false,
      error: `下载 Figma 图片失败: ${(error as Error).message}`,
    };
  }
}
