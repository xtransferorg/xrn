/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import chalk from 'chalk'

import * as Log from './utils/log'

import qrcode from 'qrcode-terminal'

import readline from 'readline'

export const BLT = '\u203A'

export const printHelp = (): void => {
  logCommandsTable([{ key: '?', msg: '显示所有提示' }])
}

export function printUsage(devServerActive: boolean) {
  const isMac = process.platform === 'darwin'

  logCommandsTable([
    { key: 'p', msg: '显示二维码和服务地址' },
    { key: 'r', msg: 'reload app(s)', disabled: !devServerActive },
    { key: 'd', msg: 'open Dev Menu', disabled: !devServerActive },
    { key: 'j', msg: 'open DevTools', disabled: !devServerActive },
    { key: 'a', msg: '在安卓真机或模拟器中打开', disabled: false },
    isMac && { key: 'i', msg: '在iOS模拟器打开', disabled: false },
    isMac && { key: 'o', msg: '在iOS真机打开', disabled: false },
    { key: 'h', msg: '在鸿蒙设备中打开', disabled: false },
  ])
}

export function printQRCode(url: string) {
  qrcode.generate(url, { small: true }, code => Log.log(code))
}

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


export function keepStatusAtBottom() {
  readline.cursorTo(process.stdout, 0, process.stdout.rows - 1); // 移动到最后一行
  readline.clearLine(process.stdout, 0); // 清除当前行
  process.stdout.write("输入 ? 显示所有提示");
  // logCommandsTable([{ key: '?', msg: '显示所有提示' }])
}

