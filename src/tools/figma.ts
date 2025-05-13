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

// 定义 Figma API 的基础 URL
const FIGMA_API_BASE_URL = "https://api.figma.com/v1";

// 定义 Figma API 错误响应类型
interface FigmaApiError {
  err: string;
  status?: number; // 有时 API 会在 err 平级返回 status
}

// 定义 Figma API 成功获取图像的响应类型
interface FigmaImageResponse {
  images: { [nodeId: string]: string | null };
  err?: string; // 成功响应也可能带有 err 字段，尽管通常是 null 或 undefined
}

// 定义 getImage 函数的参数类型接口
interface GetImageParams {
  fileKey: string;
  nodeIds: string[]; // 节点 ID 数组
  figmaToken: string; // Figma API 访问令牌
  scale?: number; // 图像缩放比例
  format?: "jpg" | "png" | "svg" | "pdf"; // 图像格式
  svg_include_id?: boolean; // SVG 是否包含 ID
  svg_simplify_stroke?: boolean; // SVG 是否简化描边
  use_absolute_bounds?: boolean; // 是否使用绝对边界
  version?: string; // 文件版本
}

/**
 * 从 Figma API 获取图像 URL。
 * @param params - 包含 fileKey, nodeIds 和 figmaToken 的对象。
 * @returns 返回一个包含图像 URL 的 Promise。
 * @throws 如果 API 请求失败，则抛出错误。
 */
export async function getImage(
  params: GetImageParams,
): Promise<{ [nodeId: string]: string | null }> {
  const {
    fileKey,
    nodeIds,
    figmaToken,
    scale,
    format,
    svg_include_id,
    svg_simplify_stroke,
    use_absolute_bounds,
    version,
  } = params;
  // 构建 API 请求 URL，包含节点 ID
  let apiUrl = `${FIGMA_API_BASE_URL}/images/${fileKey}?ids=${nodeIds.join(",")}`;

  // 添加可选参数到 URL
  if (scale !== undefined) {
    apiUrl += `&scale=${scale}`;
  }
  if (format !== undefined) {
    apiUrl += `&format=${format}`;
  }
  if (svg_include_id !== undefined && format === "svg") {
    apiUrl += `&svg_include_id=${svg_include_id}`;
  }
  if (svg_simplify_stroke !== undefined && format === "svg") {
    apiUrl += `&svg_simplify_stroke=${svg_simplify_stroke}`;
  }
  if (use_absolute_bounds !== undefined) {
    apiUrl += `&use_absolute_bounds=${use_absolute_bounds}`;
  }
  if (version !== undefined) {
    apiUrl += `&version=${version}`;
  }

  // 发起 API 请求
  const response = await fetch(apiUrl, {
    method: "GET", // HTTP 请求方法
    headers: {
      "X-FIGMA-TOKEN": figmaToken, // Figma API 访问令牌
    },
  });

  // 检查响应状态
  if (!response.ok) {
    // 如果响应状态不为 OK，则抛出错误
    const errorData = (await response.json()) as FigmaApiError;
    throw new Error(
      `Figma API request failed with status ${response.status}: ${errorData.err}`,
    );
  }

  // 解析响应数据为 JSON 格式
  const data = (await response.json()) as FigmaImageResponse;
  // 检查返回数据中是否包含错误信息
  if (data.err) {
    // 如果包含错误信息，则抛出错误
    throw new Error(`Figma API error: ${data.err}`);
  }
  // 返回图像数据
  return data.images;
}

/**
 * 从 Figma API 获取图片信息
 * @param figmaUrl - Figma 设计链接
 * @param nodeIds - 可选的节点 ID 数组。
 * @param scale - 图像缩放比例
 * @param format - 图像格式
 * @param svg_include_id - SVG 是否包含 ID
 * @param svg_simplify_stroke - SVG 是否简化描边
 * @param use_absolute_bounds - 是否使用绝对边界
 * @param version - 文件版本
 * @returns 返回一个包含图片信息或错误信息的对象。
 */
export async function getFigmaImages(
  figmaUrl: string,
  nodeIds?: string[],
  scale?: number,
  format?: "jpg" | "png" | "svg" | "pdf",
  svg_include_id?: boolean,
  svg_simplify_stroke?: boolean,
  use_absolute_bounds?: boolean,
  version?: string,
): Promise<FigmaImageResponse> {
  try {
    // 检查 FIGMA_API_TOKEN 是否已设置
    const figmaToken = process.env.FIGMA_API_TOKEN;
    if (!figmaToken) {
      // 如果未设置 FIGMA_API_TOKEN，则抛出错误
      throw new Error(
        "FIGMA_API_TOKEN 环境变量未设置。请在配置文件中设置。例：FIGMA_API_TOKEN=your_token",
      );
    }

    // 从 Figma URL 中提取 fileKey 和 nodeId
    const { fileKey, nodeId: nodeIdFromUrl } = extractFigmaParams(figmaUrl);

    // 确定要获取图片的节点 ID 列表
    let idsToFetch: string[] = [];
    if (nodeIds && nodeIds.length > 0) {
      // 如果提供了 nodeIds 数组，则使用该数组
      idsToFetch = nodeIds;
    } else if (nodeIdFromUrl) {
      // 否则，如果 URL 中包含 nodeId，则使用该 nodeId
      idsToFetch = [nodeIdFromUrl];
    } else {
      // 如果两者都未提供，则抛出错误
      throw new Error("未提供节点 ID，无法获取图片");
    }

    // 构建 API 请求参数
    const params: GetImageParams = {
      fileKey,
      nodeIds: idsToFetch,
      figmaToken,
      scale,
      format,
      svg_include_id,
      svg_simplify_stroke,
      use_absolute_bounds,
      version,
    };

    // 发起请求
    const images = await getImage(params);

    return {
      images,
    };
  } catch (error: unknown) {
    // 打印错误信息到控制台
    console.error("获取 Figma 图片失败:", error);
    // 返回包含错误信息的对象
    const errorMessage =
      error instanceof Error ? error.message : "获取 Figma 图片时发生未知错误";
    return {
      images: {},
      err: errorMessage,
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
