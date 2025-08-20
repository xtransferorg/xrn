import { LogBoxTurboModule, buildRNComponent } from '@rnoh/react-native-openharmony';
import {
  Tag,
  RNOHError,
  JSBundleProvider,
  RNInstance,
  RNInstanceOptions,
  RNOHLogger,
  RNComponentContext,
  RNOHCoreContext,
  RNOHContext
} from '@rnoh/react-native-openharmony';

import {
  CustomComponentBuilder,
  RNDevLoadingView,
  WrappedCustomRNComponentBuilder,
} from '@rnoh/react-native-openharmony/src/main/ets/RNOH';
import { RNSurface, SurfaceConfig2 } from '@rnoh/react-native-openharmony/src/main/ets/RNSurface';
import { LogBoxDialog } from "@rnoh/react-native-openharmony"
import { updateJSBundleProviderAppKeys } from './XRNJSBundleProvider';
import { BundleInfoManager } from '../bundle/BundleInfoManager';


interface CustomRNInstance {
  rnInstance: RNInstance
}

export type RNInstanceConfig = CustomRNInstance | RNInstanceOptions

@Builder
export function buildRNComponentForTag(ctx: RNComponentContext, tag: Tag) {
  buildRNComponent(ctx, ctx.descriptorRegistry.findDescriptorWrapperByTag(tag)!)
}

/**
 * @api: RN_APP_DEVELOPER
 * The RNApp component renders a React Native application. It is recommended for use when the application consists of a single
 * surface. For applications with multiple surfaces, consider using RNSurface instead.
 */
@Component
@Preview
export struct XRNApp {

  /**
   * Bundle 名
   */
  public bundleName: string = ''
  /**
   * Required. RNInstance or RNInstanceOptions used to create RNInstance.
   * If RNInstanceOptions is provided, this component takes the responsibility for creating and managing RNInstance.
   */
  public rnInstanceConfig!: RNInstanceConfig
  /**
   * Required. App name. Check react-native/Libraries/AppRegistry for more info.
   */
  public appKey: string = ''
  /**
   * Optional. If provided, runs JS Bundle in the rnInstance. Creates a surface after bundle has been loaded.
   */
  public jsBundleProvider: JSBundleProvider | undefined = undefined
  /**
   * Optional. Initial properties for the main component of the React Native app.
   */
  public initialProps: Record<string, string> = {}
  /**
   * Required if wrappedCustomRNComponentBuilder is not provided. Builds a custom fabric component.
   * @deprecated: use wrappedCustomRNComponentBuilder instead
   */
  @BuilderParam public buildCustomComponent: CustomComponentBuilder
  /**
   * Required unless buildCustomComponent is still used. Builds custom fabric components.
   */
  public wrappedCustomRNComponentBuilder: WrappedCustomRNComponentBuilder | undefined = undefined
  /**
   * Optional. Called before a surface is visible, and rnInstance is available.
   */
  public onSetUp: (rnInstance: RNInstance) => Promise<void> | void = () => Promise.resolve()

  public onReload?: (rnInstance: RNInstance, reason?: string) => Promise<void> | void

  // -------------------------------------------------------------------------------------------------------------------
  @StorageLink('RNOHCoreContext') private rnohCoreContext: RNOHCoreContext | undefined = undefined
  private rnInstance!: RNInstance
  @State private shouldShow: boolean = false
  private logBoxDialogController!: CustomDialogController
  private shouldDestroyRNInstance: boolean = false
  private cleanUpCallbacks: (() => void)[] = []
  private logger!: RNOHLogger
  private ctx!: RNComponentContext

  aboutToAppear() {
    this.init()
  }

  aboutToDisappear() {
    this.cleanUp()
  }

  private async init() {
    this.logger = this.rnohCoreContext!.logger.clone("RNApp")
    const stopTracing = this.logger.clone("init").startTracing()

    const bundleInfo = BundleInfoManager.INSTANCE.getBundleInfo(this.bundleName)
    bundleInfo?.addAppKey(this.appKey)

    try {
      await (async () => {
        if (!this.wrappedCustomRNComponentBuilder) {
          this.logger.error(new RNOHError({
            whatHappened: "RNApp::wrappedCustomRNComponentBuilder is undefined",
            howCanItBeFixed: ["Please provide a wrapped custom component builder. Use ArkUI's \"wrapBuilder\" to create the wrapper."]
          }))
          return
        }
        this.rnInstance = await this.getOrCreateRNInstance()
        this.ctx = new RNComponentContext(
          RNOHContext.fromCoreContext(
            this.rnohCoreContext,
            this.rnInstance
          ),
          this.wrappedCustomRNComponentBuilder,
          wrapBuilder(buildRNComponentForTag),
          new Map(),
        )
        this.logBoxDialogController = new CustomDialogController({
          cornerRadius: 0,
          customStyle: true,
          alignment: DialogAlignment.TopStart,
          backgroundColor: Color.Transparent,
          builder: LogBoxDialog({
            ctx: this.ctx,
            rnInstance: this.rnInstance,
            initialProps: this.initialProps,
            buildCustomComponent: this.buildCustomComponent,
          })
        })
        this.cleanUpCallbacks.push(this.rnInstance.getTurboModule<LogBoxTurboModule>(LogBoxTurboModule.NAME).eventEmitter.subscribe("SHOW",
          () => {
            this.logBoxDialogController.open()
          }))
        this.cleanUpCallbacks.push(this.rnInstance.getTurboModule<LogBoxTurboModule>(LogBoxTurboModule.NAME).eventEmitter.subscribe("HIDE",
          () => {
            this.logBoxDialogController.close()
          }))
        this.rnInstance.subscribeToLifecycleEvents('RELOAD', async (data) => {
            if (this.onReload) {
              await this.onReload(this.rnInstance, data.reason)
            } else {
              await this.cleanUp()
              this.init()
            }
        })
        // this.cleanUpCallbacks.push(this.ctx.devToolsController.eventEmitter.subscribe("RELOAD", async (data) => {
        //   if (this.onReload) {
        //     await this.onReload(this.rnInstance, data.reason)
        //   } else {
        //     await this.cleanUp()
        //     this.init()
        //   }
        // }))
        await this.onSetUp(this.rnInstance)
        updateJSBundleProviderAppKeys(this.jsBundleProvider, BundleInfoManager.INSTANCE.getBundleInfo(this.bundleName)?.getModuleNames())
        const jsBundleExecutionStatus = this.rnInstance.getBundleExecutionStatus(this.jsBundleProvider?.getURL())
        if (this.jsBundleProvider && jsBundleExecutionStatus === undefined) {
          await this.rnInstance.runJSBundle(this.jsBundleProvider)
          this.shouldShow = true
          return;
        }
        if (jsBundleExecutionStatus !== "DONE") {
          this.cleanUpCallbacks.push(this.rnInstance.subscribeToLifecycleEvents("JS_BUNDLE_EXECUTION_FINISH",
            (args) => {
              if (args.appKeys.includes(this.appKey)) {
                this.shouldShow = true
              }
            }))
        } else {
          this.shouldShow = true
        }
      })()
      stopTracing()
    } catch (err) {
      if (err instanceof RNOHError) {
        this.rnohCoreContext!.reportRNOHError(err)
      } else if (typeof err === "string") {
        this.rnohCoreContext!.logger.error(err)
      } else if (err instanceof Error) {
        this.rnohCoreContext!.logger.error(err.message)
      } else {
        this.rnohCoreContext!.logger.error("Fatal exception")
      }
      stopTracing()
    }
  }

  private async cleanUp() {
    const stopTracing = this.logger.clone("cleanUp").startTracing()
    this.shouldShow = false
    if (this.shouldDestroyRNInstance) {
      await this.rnohCoreContext!.destroyAndUnregisterRNInstance(this.rnInstance)
    }
    this.cleanUpCallbacks.forEach(cleanUp => cleanUp())
    stopTracing()
  }

  private getOrCreateRNInstance(): Promise<RNInstance> {
    if (Object.keys(this.rnInstanceConfig).includes("rnInstance")) {
      return Promise.resolve((this.rnInstanceConfig as CustomRNInstance).rnInstance)
    } else {
      const options = this.rnInstanceConfig
      this.shouldDestroyRNInstance = true
      return this.rnohCoreContext!.createAndRegisterRNInstance(options as RNInstanceOptions)
    }
  }

  build() {
    Stack() {
      if (this.shouldShow) {
        RNSurface({
          ctx: this.ctx,
          surfaceConfig: {
            initialProps: this.initialProps ?? {},
            appKey: this.appKey,
          } as SurfaceConfig2,
        })
      }
      if (this.rnohCoreContext!.isDebugModeEnabled) {
        RNDevLoadingView({ useSafeAreaInsets: true, ctx: this.rnohCoreContext }).position({ x: 0, y: 0 })
      }
    }
    //fix keyboard issue
    //.expandSafeArea([SafeAreaType.KEYBOARD])
    .width("100%")
    .height("100%")
  }
}
