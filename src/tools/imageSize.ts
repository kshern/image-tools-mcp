import probe from "probe-image-size";
import fs from "fs";

// 从URL获取图片尺寸的纯函数实现
export async function getImageSizeFromUrl(imageUrl: string) {
  // 获取图片尺寸信息
  const imageInfo = await probe(imageUrl);
  return {
    width: imageInfo.width,
    height: imageInfo.height,
    type: imageInfo.type,
    mime: imageInfo.mime,
  };
}

// 从本地文件获取图片尺寸的纯函数实现
export async function getLocalImageSize(imagePath: string) {
  // 检查文件是否存在
  if (!fs.existsSync(imagePath)) {
    throw new Error(`文件不存在: ${imagePath}`);
  }

  // 使用Buffer（同步方法）
  const imageBuffer = fs.readFileSync(imagePath);
  const result = probe.sync(imageBuffer);

  if (!result) {
    throw new Error(`无法识别图片格式: ${imagePath}`);
  }

  return {
    width: result.width,
    height: result.height,
    type: result.type,
    mime: result.mime,
    path: imagePath,
  };
}
