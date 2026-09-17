import { BuildEnv } from "../typing";

export function isProd(buildEnv: BuildEnv | string) {
    return buildEnv === BuildEnv.prod.toString() || buildEnv === BuildEnv.preProd.toString()
}

export function padZero(value: number): string {
    return value.toString().padStart(2, '0');
}

export function hasVersionError(buildEnv: BuildEnv | string) {
    return process.env._HAS_VERSION_ERROR === 'true' || isProd(buildEnv)
}
