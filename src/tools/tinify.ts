import tinify from "tinify";
import fs from "fs";
import path from "path";
import os from "os";

// 设置API密钥
const setTinifyApiKey = () => {
  // 从环境变量获取API密钥
  const apiKey = process.env.TINIFY_API_KEY;
  if (!apiKey) {
    throw new Error("TINIFY_API_KEY 环境变量未设置");
  }
  tinify.key = apiKey;
};

// 从URL压缩图片的纯函数实现
export async function compressImageFromUrl(
  imageUrl: string, 
  outputFormat?: "webp" | "jpeg" | "jpg" | "png"
) {
  // 设置API密钥
  setTinifyApiKey();

  // 从URL获取图片并压缩
  let source = tinify.fromUrl(imageUrl);

  // 如果指定了输出格式，则转换格式
  if (outputFormat) {
    // 使用类型断言来避免类型错误
    const convertOptions = { type: outputFormat === "jpg" ? "jpeg" : outputFormat };
    source = source.convert(convertOptions as any);
  }

  // 获取压缩后的图片数据
  const resultData = await new Promise<Buffer>((resolve, reject) => {
    source.toBuffer(function(err: any, data: any) {
      if (err) reject(err);
      else if (data) resolve(Buffer.from(data));
      else reject(new Error('没有从tinify返回数据'));
    });
  });

  // 计算压缩率
  const originalSize = (await fetch(imageUrl).then(res => res.arrayBuffer())).byteLength;
  const compressedSize = resultData.length;
  const compressionRatio = ((1 - compressedSize / originalSize) * 100).toFixed(2);

  // 创建临时文件保存压缩后的图片
  const tempDir = os.tmpdir();
  const originalFilename = new URL(imageUrl).pathname.split("/").pop() || "image";
  const extension = outputFormat || path.extname(originalFilename).slice(1) || "jpg";
  const tempFilePath = path.join(tempDir, `compressed_${Date.now()}.${extension}`);
  
  fs.writeFileSync(tempFilePath, resultData);

  return {
    originalSize,
    compressedSize,
    compressionRatio: `${compressionRatio}%`,
    tempFilePath,
    format: extension,
  };
}

// 从本地文件压缩图片的纯函数实现
export async function compressLocalImage(
  imagePath: string,
  outputPath?: string,
  outputFormat?: "image/webp" | "image/jpeg" | "image/jpg" | "image/png"
) {
  // 设置API密钥
  setTinifyApiKey();

  // 检查文件是否存在
  if (!fs.existsSync(imagePath)) {
    throw new Error(`文件不存在: ${imagePath}`);
  }

  // 获取原始文件大小
  const originalSize = fs.statSync(imagePath).size;

  // 从本地文件压缩图片
  let source = tinify.fromFile(imagePath);

  // 如果指定了输出格式，则转换格式
  if (outputFormat) {
    // 使用类型断言来避免类型错误
    const convertOptions = { type: outputFormat === "image/jpg" ? "image/jpeg" : outputFormat };
    source = source.convert(convertOptions as any);
  }

  // 确定输出路径
  let finalOutputPath = outputPath;
  if (!finalOutputPath) {
    const dir = path.dirname(imagePath);
    const ext = outputFormat ? outputFormat.split('/')[1] : path.extname(imagePath).slice(1) || "jpg";
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
    originalSize,
    compressedSize,
    compressionRatio: `${compressionRatio}%`,
    outputPath: finalOutputPath,
    format: outputFormat ? outputFormat.split('/')[1] : path.extname(finalOutputPath).slice(1),
  };
}
