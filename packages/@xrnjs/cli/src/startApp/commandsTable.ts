/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import chalk from 'chalk'

import * as Log from './utils/log'

import qrcode from 'qrcode-terminal'

import readline from 'readline'

/** Bullet point character used in command table display */
export const BLT = '\u203A'

/**
 * Print help information showing available commands
 * Displays a simple help message with the question mark command
 */
export const printHelp = (): void => {
  logCommandsTable([{ key: '?', msg: '显示所有提示' }])
}

/**
 * Print the main usage table with available commands
 * Shows different commands based on platform and server status
 * 
 * @param devServerActive - Whether the development server is currently active
 */
export function printUsage(devServerActive: boolean) {
  const isMac = process.platform === 'darwin'

  logCommandsTable([
    // { key: 's', msg: '启动开发服务器' },
    { key: 'p', msg: '显示二维码和服务地址' },
    { key: 'r', msg: 'reload load', disabled: !devServerActive },
    // { key: 'd', msg: 'open developer menu', disabled: !devServerActive },
    { key: 'a', msg: '在安卓真机或模拟器中打开', disabled: false },
    isMac && { key: 'i', msg: '在iOS模拟器打开', disabled: false },
    isMac && { key: 'o', msg: '在iOS真机打开', disabled: false },
    { key: 'h', msg: '在鸿蒙设备中打开', disabled: false },
  ])
}

/**
 * Generate and display a QR code for the given URL
 * Uses qrcode-terminal to render the QR code in the terminal
 * 
 * @param url - The URL to encode in the QR code
 */
export function printQRCode(url: string) {
  qrcode.generate(url, { small: true }, code => Log.log(code))
}

/**
 * Log a formatted command table to the console
 * Displays commands with keys, messages, and status information
 * Handles disabled commands by dimming their appearance
 * 
 * @param ui - Array of command objects with key, message, status, and disabled properties
 */
function logCommandsTable(ui: (false | { key?: string; msg?: string; status?: string; disabled?: boolean })[]) {
  Log.log(
    ui
      .filter(Boolean)
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment, @typescript-eslint/prefer-ts-expect-error
      // @ts-ignore
      .map(({ key, msg, status, disabled }) => {
        if (!key) return ''
        let view = `${BLT} `
        if (key.length === 1) view += '输入 '
        view += chalk`{bold ${key}} {dim │} `
        view += msg
        if (status) view += ` ${chalk.dim(`(${chalk.italic(status)})`)}`

        if (disabled) view = chalk.dim(view)

        return view
      })
      .join('\n'),
  )
}

/**
 * Display a status message at the bottom of the terminal
 * Moves cursor to the last line and shows a help prompt
 * Used to keep important information visible during interactive sessions
 */
export function keepStatusAtBottom() {
  readline.cursorTo(process.stdout, 0, process.stdout.rows - 1); // Move to the last line
  readline.clearLine(process.stdout, 0); // Clear the current line
  process.stdout.write("输入 ? 显示所有提示");
  // logCommandsTable([{ key: '?', msg: '显示所有提示' }])
}

