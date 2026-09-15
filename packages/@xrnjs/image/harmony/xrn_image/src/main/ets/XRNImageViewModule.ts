import { TurboModule } from '@rnoh/react-native-openharmony/ts';
import { TM } from "@rnoh/react-native-openharmony/generated/ts"
import { fileUri } from '@kit.CoreFileKit';
import { wantConstant } from '@kit.AbilityKit';
import { uniformTypeDescriptor } from '@kit.ArkData';
import FS from '@ohos.file.fs'

export class XRNImageViewModule extends TurboModule implements TM.XRNImageView.Spec {
  prefetch(urls: string[], cachePolicy: null | unknown, headers: {}): Promise<boolean> {
    return Promise.resolve(false);
  }

  clearMemoryCache(): Promise<boolean> {
    return Promise.resolve(false);
  }

  clearDiskCache(): Promise<boolean> {
    return Promise.resolve(false)
  }

  getCachePathAsync(cacheKey: string): Promise<string> {
    return Promise.resolve("");
  }

}
