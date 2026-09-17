import { RNOHLogger } from '@rnoh/react-native-openharmony/src/main/ets/RNOH/RNOHLogger';
import type { DevToolsController } from "@rnoh/react-native-openharmony/src/main/ets/RNOH/DevToolsController"
import type { DevMenu } from "@rnoh/react-native-openharmony/src/main/ets/RNOH/DevMenu"
import { ReconnectingWebSocket } from '@rnoh/react-native-openharmony/src/main/ets/RNOH/ReconnectingWebSocket';

export interface XRNJSPackagerClientConfig {
  host: string,
  port: number | string,
}

export class XRNJSPackagerClient {
  private webSocket: ReconnectingWebSocket;
  private logger: RNOHLogger;
  // private connected: boolean;

  constructor(logger: RNOHLogger, private onMessage: (message: any, config: XRNJSPackagerClientConfig) => void) {
    this.logger = logger.clone("XRNJSPackagerClient");
  }

  public connectToMetroMessages(config: XRNJSPackagerClientConfig) {
    // if (this.connected) {
    //   return;
    // }
    const url = this.buildUrl(config);

    const onMessage = (data) => {

      if (typeof data === "string") {
        const message = JSON.parse(data);
        this.onMessage(message, config)
      } else {
        this.logger.warn(`Unsupported data: ${data}`)
      }

    }

    const onDisconnected = (err) => {
      if (err) {
        this.logger.error("Websocket connection failed, err: " + JSON.stringify(err));
      }
    }

    this.webSocket = new ReconnectingWebSocket(url, { onMessage, onDisconnected })
  }

  public async onDestroy() {
    this.webSocket.close()
  }

  private buildUrl(config: XRNJSPackagerClientConfig): string {
    return `ws://${config.host}:${config.port}/message`;
  }
}