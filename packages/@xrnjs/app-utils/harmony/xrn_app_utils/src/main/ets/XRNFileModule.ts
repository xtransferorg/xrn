import { TurboModule } from '@rnoh/react-native-openharmony/ts';
import { TM } from "@rnoh/react-native-openharmony/generated/ts"


export class XRNFileModule extends TurboModule implements TM.XRNFileModule.Spec {
  clearFrescoCache(): Promise<boolean> {
    //鸿蒙平台无需实现
    return new Promise((resolve, reject) => {
      resolve(true)
    })
  }

  insertImageToPhotoLibrary(path: string, fileName: string | null): Promise<boolean> {
    //鸿蒙平台无需实现
    return new Promise((resolve, reject) => {
      resolve(true)
    })
  }

}