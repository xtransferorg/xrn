/* eslint-disable @typescript-eslint/no-misused-promises */
import * as Log from "./utils/log";
import logger from "../utlis/logger";

const CTRL_C = "\u0003";

/**
 * Abstract key stroke interceptor for handling keyboard input in interactive CLI
 * Manages raw mode input handling and provides a clean interface for key press events
 */
export class KeyPressHandler {
  private isInterceptingKeyStrokes = false;
  private isHandlingKeyPress = false;

  constructor(public onPress: (key: string) => Promise<void>) {}

  /**
   * Create an interaction listener for handling pause/resume events
   * This is useful for supporting interactive prompts and other input scenarios
   * 
   * @returns A listener function that can be used to handle interaction state changes
   */
  createInteractionListener() {
    // Support observing prompts.
    let wasIntercepting = false;

    const listener = ({ pause }: { pause: boolean }) => {
      if (pause) {
        // Track if we were already intercepting key strokes before pausing, so we can
        // resume after pausing.
        wasIntercepting = this.isInterceptingKeyStrokes;
        this.stopInterceptingKeyStrokes();
      } else if (wasIntercepting) {
        // Only start if we were previously intercepting.
        this.startInterceptingKeyStrokes();
      }
    };

    return listener;
  }

  /**
   * Internal handler for key press events
   * Prevents multiple simultaneous key press handling and manages the processing state
   * 
   * @param key - The pressed key character
   */
  private handleKeypress = async (key: string) => {
    // Prevent sending another event until the previous event has finished.
    if (this.isHandlingKeyPress && key !== CTRL_C) {
      return;
    }
    this.isHandlingKeyPress = true;
    try {
      logger.info(`Key pressed: ${key}`);
      await this.onPress(key);
    } catch (error) {
    } finally {
      this.isHandlingKeyPress = false;
    }
  };

  /**
   * Start intercepting all key strokes and passing them to the input `onPress` method
   * Enables raw mode on stdin to capture individual key presses
   */
  startInterceptingKeyStrokes() {
    if (this.isInterceptingKeyStrokes) {
      return;
    }
    this.isInterceptingKeyStrokes = true;
    const { stdin } = process;
    // TODO: This might be here because of an old Node version.
    if (!stdin.setRawMode) {
      Log.warn(
        "Using a non-interactive terminal, keyboard commands are disabled."
      );
      return;
    }
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding("utf8");
    stdin.on("data", this.handleKeypress);
  }

  /**
   * Stop intercepting all key strokes
   * Disables raw mode and removes event listeners
   */
  stopInterceptingKeyStrokes() {
    if (!this.isInterceptingKeyStrokes) {
      return;
    }
    this.isInterceptingKeyStrokes = false;
    const { stdin } = process;
    stdin.removeListener("data", this.handleKeypress);
    // TODO: This might be here because of an old Node version.
    if (!stdin.setRawMode) {
      Log.warn(
        "Using a non-interactive terminal, keyboard commands are disabled."
      );
      return;
    }
    stdin.setRawMode(false);
    stdin.resume();
  }
}
