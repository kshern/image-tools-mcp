import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import express from "express";
import type { Request, Response } from "express";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

// 导出所有传输相关函数和类
export * from "@modelcontextprotocol/sdk/server/stdio.js";

/**
 * JSON-RPC消息接口
 * 用于消息传输
 */
export interface JSONRPCMessage {
  jsonrpc: string;
  id?: string | number;
  method?: string;
  params?: any;
  result?: any;
  error?: any;
}

/**
 * SSE服务器传输类接口
 * 定义传输层所需的方法
 */
export interface Transport {
  start(): Promise<void>;
  close(): Promise<void>;
  send(message: JSONRPCMessage | string): Promise<void>;
  onMessage?: (message: string) => Promise<void>;
}

/**
 * SSE服务器传输类
 * 实现服务器发送事件(SSE)传输方式
 */
export class SSEServerTransport implements Transport {
  private readonly messageEndpoint: string;
  private response: Response | null = null;
  private messageQueue: string[] = [];
  private connected = false;

  /**
   * 构造函数
   * @param messageEndpoint 消息端点路径
   * @param res Express响应对象
   */
  constructor(messageEndpoint: string, res?: Response) {
    this.messageEndpoint = messageEndpoint;
    this.response = res || null;
  }

  /**
   * 设置SSE响应
   * @param res Express响应对象
   */
  setResponse(res: Response): void {
    this.response = res;
    this.setupSSE();
  }

  /**
   * 设置SSE连接
   */
  setupSSE(): void {
    if (!this.response) {
      return;
    }

    // 设置SSE响应头
    this.response.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "Access-Control-Allow-Origin": "*",
    });

    // 发送连接建立消息
    this.response.write("event: connected\ndata: {}\n\n");
    this.connected = true;

    // 发送队列中的消息
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift();
      if (message) {
        this.response.write(`data: ${message}\n\n`);
      }
    }
  }

  /**
   * 处理客户端发送的POST消息
   * @param req Express请求对象
   * @param res Express响应对象
   */
  async handlePostMessage(req: Request, res: Response): Promise<void> {
    console.log("处理POST消息");
    const body = req.body;
    console.log("消息内容:", typeof body === "string" ? body : JSON.stringify(body));
    
    if (this.onMessage && typeof body === "string") {
      try {
        await this.onMessage(body);
        res.status(200).json({ status: "success" });
      } catch (error) {
        console.error("处理消息时出错:", error);
        res.status(500).json({ 
          status: "error", 
          message: (error as Error).message 
        });
      }
    } else {
      console.warn("没有设置onMessage处理器或消息格式不正确");
      res.status(400).json({ 
        status: "error", 
        message: "Invalid message format or no message handler" 
      });
    }
  }

  /**
   * 发送消息到客户端
   * @param message 要发送的消息
   */
  async send(message: JSONRPCMessage | string): Promise<void> {
    const messageStr = typeof message === "string" ? message : JSON.stringify(message);
    
    if (this.connected && this.response) {
      this.response.write(`data: ${messageStr}\n\n`);
    } else {
      this.messageQueue.push(messageStr);
    }
  }

  /**
   * 传输启动方法（Transport接口要求）
   */
  async start(): Promise<void> {
    // SSE传输不需要额外启动步骤
  }

  /**
   * 关闭传输（Transport接口要求）
   */
  async close(): Promise<void> {
    if (this.response) {
      this.response.end();
      this.response = null;
      this.connected = false;
    }
  }
}

/**
 * 直接处理工具调用
 * @param server MCP服务器实例
 * @param toolName 工具名称
 * @param options 工具选项
 * @returns 工具执行结果
 */
export const executeToolDirectly = async (
  server: McpServer,
  toolName: string,
  options: any
): Promise<any> => {
  console.log(`直接执行工具: ${toolName}，选项:`, options);

  // 根据工具名称处理不同的工具
  try {
    switch (toolName) {
      case "get_image_size": {
        // 验证选项
        if (!options.imageUrl) {
          throw new Error("缺少必要参数: imageUrl");
        }

        // 调用工具处理函数
        const result = await server.executeToolByName(toolName, { options });
        console.log("获取图片尺寸结果:", result);
        return result;
      }

      case "get_local_image_size": {
        // 验证选项
        if (!options.imagePath) {
          throw new Error("缺少必要参数: imagePath");
        }

        // 调用工具处理函数
        const result = await server.executeToolByName(toolName, { options });
        console.log("获取本地图片尺寸结果:", result);
        return result;
      }

      case "compress_image_from_url": {
        // 验证选项
        if (!options.imageUrl) {
          throw new Error("缺少必要参数: imageUrl");
        }

        // 验证输出格式
        if (options.outputFormat && 
            !["webp", "jpeg", "jpg", "png"].includes(options.outputFormat)) {
          throw new Error("无效的输出格式。支持的格式: webp, jpeg, jpg, png");
        }

        // 调用工具处理函数
        const result = await server.executeToolByName(toolName, { options });
        console.log("压缩URL图片结果:", result);
        return result;
      }

      case "compress_local_image": {
        // 验证选项
        if (!options.imagePath) {
          throw new Error("缺少必要参数: imagePath");
        }

        // 验证输出格式
        if (options.outputFormat && 
            !["webp", "jpeg", "jpg", "png"].includes(options.outputFormat)) {
          throw new Error("无效的输出格式。支持的格式: webp, jpeg, jpg, png");
        }

        // 调用工具处理函数
        const result = await server.executeToolByName(toolName, { options });
        console.log("压缩本地图片结果:", result);
        return result;
      }

      default:
        throw new Error(`未知工具: ${toolName}`);
    }
  } catch (error) {
    console.error(`执行工具 ${toolName} 时出错:`, error);
    throw error;
  }
};

/**
 * 创建Express应用程序用于SSE传输
 * @param server McpServer实例
 * @param port 服务器端口
 * @returns Express应用实例
 */
export const createExpressApp = (
  server: McpServer,
  port: number = 3000
): express.Express => {
  const app = express();

  // 配置中间件
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // 允许跨域请求
  app.use((_, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept"
    );
    next();
  });

  // 创建SSE传输实例
  const transport = new SSEServerTransport("/messages");

  // 设置消息处理函数
  transport.onMessage = async (message: string) => {
    console.log("收到客户端消息:", message);
    
    try {
      // 解析消息
      const parsedMessage = JSON.parse(message);
      
      // 检查是否是工具调用请求
      if (parsedMessage.method === "executeToolDirectly") {
        console.log("收到工具调用请求");
        
        const { toolName, options } = parsedMessage.params;
        console.log(`工具名称: ${toolName}, 选项:`, options);
        
        // 执行工具
        try {
          const result = await executeToolDirectly(server, toolName, options);
          
          // 发送成功响应
          const response = {
            jsonrpc: "2.0",
            id: parsedMessage.id,
            result
          };
          await transport.send(response);
        } catch (error) {
          console.error("执行工具时出错:", error);
          
          // 发送错误响应
          const errorResponse = {
            jsonrpc: "2.0",
            id: parsedMessage.id,
            error: {
              code: -32603,
              message: "内部错误",
              data: String(error)
            }
          };
          await transport.send(errorResponse);
        }
      } else {
        // 将消息传递给服务器处理
        await server.handleMessage(message);
      }
    } catch (error) {
      console.error("处理消息时出错:", error);
      
      // 发送错误响应
      const errorResponse = {
        jsonrpc: "2.0",
        id: typeof message === "object" && message.id ? message.id : null,
        error: {
          code: -32603,
          message: "内部错误",
          data: String(error)
        }
      };
      await transport.send(errorResponse);
    }
  };
  
  // 立即连接服务器，这样可以在SSE连接建立前就设置好onMessage回调
  console.log("预先连接服务器，设置消息处理器");
  server.connect(transport);

  // 设置SSE端点
  app.get("/sse", (req: Request, res: Response) => {
    console.log("SSE连接已建立");
    transport.setResponse(res);
    // 不需要再次连接服务器，因为已经在上面连接过了
    // server.connect(transport);
  });

  // 设置消息接收端点
  app.post("/messages", (req: Request, res: Response) => {
    console.log("收到POST消息请求");
    transport.handlePostMessage(req, res);
  });

  // 添加静态文件服务
  app.use(express.static("public"));

  // 添加服务器状态端点
  app.get("/status", (_: Request, res: Response) => {
    // 使用类型断言获取服务器元数据
    const serverAny = server as any;
    res.json({
      status: "running",
      name: serverAny.metadata?.name || "image-tools-mcp-server",
      version: serverAny.metadata?.version || "0.0.1",
    });
  });

  // 启动服务器
  app.listen(port, () => {
    console.log(`SSE服务器已启动，监听端口 ${port}`);
    console.log(`访问 http://localhost:${port}/sse 连接到SSE流`);
    console.log(`POST请求发送到 http://localhost:${port}/messages`);
  });

  return app;
};

/**
 * 创建并返回适当的传输方式
 * @param server MCP服务器实例
 * @param options 传输选项
 * @returns 传输实例
 */
export const createTransport = (
  server: McpServer,
  options: { 
    type: "stdio" | "sse";
    port?: number; 
  }
): StdioServerTransport | void => {
  if (options.type === "stdio") {
    // 创建标准输入/输出传输
    const transport = new StdioServerTransport();
    server.connect(transport);
    return transport;
  } else if (options.type === "sse") {
    // 创建SSE传输
    const port = options.port || 3000;
    createExpressApp(server, port);
    return;
  }
};
