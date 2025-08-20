'use client';

import { ensureNativeModulesAreInstalled } from './ensureNativeModulesAreInstalled';
import type { NativeModule } from './ts-declarations/NativeModule';

ensureNativeModulesAreInstalled();

export default {} as typeof NativeModule;
