import { requireNativeModule } from '@xrnjs/modules-core';

import type { ImageNativeModule } from './Image.types';

export default requireNativeModule<ImageNativeModule>('XRNImageView');
