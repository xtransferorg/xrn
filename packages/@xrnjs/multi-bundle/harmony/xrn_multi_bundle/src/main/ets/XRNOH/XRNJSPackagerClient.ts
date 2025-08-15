import webSocket from '@ohos.net.webSocket';
import { DevMenu } from '@rnoh/react-native-openharmony/src/main/ets/RNOH/DevMenu';
import { DevToolsController } from '@rnoh/react-native-openharmony/src/main/ets/RNOH/DevToolsController';
import { RNOHLogger } from '@rnoh/react-native-openharmony/src/main/ets/RNOH/RNOHLogger';

export interface XRNJSPackagerClientConfig {
  host: string,
  port: number | string,
}

export class XRNJSPackagerClient {
  private webSocket: webSocket.WebSocket;
  private logger: RNOHLogger;
  private connected: boolean

  constructor(logger: RNOHLogger, private onMessage: (message: any, config: XRNJSPackagerClientConfig) => void) {
    this.logger = logger.clone("XRNJSPackagerClient");
  }

  public connectToMetroMessages(config: XRNJSPackagerClientConfig) {
    if (this.connected) {
      return;
    }
    this.webSocket = webSocket.createWebSocket();
    const url = this.buildUrl(config);
    this.webSocket.on("message", (err, data) => {
      if (err) {
        this.logger.error("Websocket error " + err.message);
        return;
      }
      if (typeof data === "string") {
        const message = JSON.parse(data);
        this.onMessage(message, config)
      }
    })

    this.webSocket.on("close", () => {
      this.connected = false
    })

    this.webSocket.connect(url, (err, _data) => {
      if (!err) {
        this.connected = true
        this.logger.info("Websocket connected successfully");
      } else {
        this.logger.error("Websocket connection failed, err: " + JSON.stringify(err));
      }
    });
  }

  public async onDestroy() {
    /**
     * Closing this websocket creates prevents subsequent loading a bundle from Metro server and connecting this client, when connected using "localhost" url.
     */
    await this.webSocket?.close();
  }

  private buildUrl(config: XRNJSPackagerClientConfig): string {
    return `ws://${config.host}:${config.port}/message`;
  }
}