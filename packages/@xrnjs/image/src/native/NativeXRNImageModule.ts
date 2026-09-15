import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';
import { WithDefault } from 'react-native/Libraries/Types/CodegenTypes';

export interface Spec extends TurboModule {
  prefetch(
    urls: string[],
    cachePolicy?: WithDefault<
      'none' | 'disk' | 'memory' | 'memory-disk',
      'disk'
    >,
    headers?: {}
  ): Promise<boolean>;
  clearMemoryCache(): Promise<boolean>;
  clearDiskCache(): Promise<boolean>;
  getCachePathAsync(cacheKey: string): Promise<string>;
}

export default TurboModuleRegistry.getEnforcing<Spec>('XRNImageView');
