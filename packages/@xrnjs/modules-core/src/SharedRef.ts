'use client';

import { ensureNativeModulesAreInstalled } from './ensureNativeModulesAreInstalled';
import type { SharedRef as SharedRefType } from './ts-declarations/SharedRef';

ensureNativeModulesAreInstalled();

const SharedRef = {} as typeof SharedRefType;

export default SharedRef;
