/**
 * 传统纵线路号：红用一～九、黑用 1～9，均从**己方右手**起算。
 * 引擎 file：0=a（红左/黑右）… 8=i（红右/黑左），红在下视角。
 */
export function redFileNo(file: number): number {
  return 9 - file
}

export function blackFileNo(file: number): number {
  return file + 1
}

const RED_NUM = ['', '一', '二', '三', '四', '五', '六', '七', '八', '九'] as const

export function redFileChar(file: number): string {
  return RED_NUM[redFileNo(file)] ?? '?'
}

export function blackFileChar(file: number): string {
  return String(blackFileNo(file))
}
