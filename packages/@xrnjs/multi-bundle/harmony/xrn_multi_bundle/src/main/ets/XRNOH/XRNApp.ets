import { LogBoxTurboModule, buildRNComponent } from '@rnoh/react-native-openharmony/src/main/ets/RNOHCorePackage';
import {
  Tag,
  RNOHError,
  JSBundleProvider,
  RNInstance,
  RNInstanceOptions,
  RNOHLogger,
  RNDevLoadingView,
  RNComponentContext,
  RNPerfMonitorView,
  WrappedCustomRNComponentBuilder,
  RNOHCoreContext,
  RNOHContext,
  ComponentBuilderContext,
} from '@rnoh/react-native-openharmony/src/main/ets/RNOH';
import { RNSurface } from '@rnoh/react-native-openharmony/src/main/ets/RNSurface';
import { LogBoxDialog } from "@rnoh/react-native-openharmony/src/main/ets/LogBoxDialog"
import { RNPauseInDebuggerDialog } from "@rnoh/react-native-openharmony/src/main/ets/RNOH/RNPauseInDebuggerDialog"
import { BundleInfoManager } from '../bundle/BundleInfoManager';
import { updateJSBundleProviderAppKeys } from '../XRNOH/XRNJSBundleProvider';
import { XRNInstanceImpl } from '.';

/**
 * Represents the configuration of RNInstance unmanaged by RNOH / managed by RN_APP_DEVELOPER.
 * (RN_APP_DEVELOPER is responsible for creating and destroying RNInstance.)
 *
 * @actor RNOH_APP
 */
interface UnmanagedRNInstanceConfig {
  rnInstance: RNInstance
}

/**
 * Represents the configuration of RNInstance managed by RNOH.
 *
 * @actor RNOH_APP
 */
type ManagedRNInstanceConfig = RNInstanceOptions

/**
 * Represents the configuration of RNInstance to be used by RNApp.
 * This type is a union of two modes:
 *
 * - `UnmanagedRNInstanceConfig`: The RN_APP_DEVELOPER is responsible for creating
 *   and deleting the RNInstance. This provides more control over the instance lifecycle.
 *
 * - `ManagedRNInstanceConfig`: The RNInstance is managed by RNOH, which handles the
 *   creation and deletion internally. This simplifies usage for most scenarios.
 *
 * @actor RNOH_APP
 */
export type RNInstanceConfig = UnmanagedRNInstanceConfig | ManagedRNInstanceConfig

@Builder
export function buildRNComponentForTag(ctx: RNComponentContext, tag: Tag) {
  buildRNComponent(ctx, ctx.descriptorRegistry.findDescriptorWrapperByTag(tag)!)
}


@Builder
export function buildCustomRNComponent(ctx: ComponentBuilderContext) {
  if (ctx.customRNComponentWrappedBuilderByName.has(ctx.componentName)) {
    ctx.customRNComponentWrappedBuilderByName.get(ctx.componentName)!.builder(ctx)
  } else if (ctx.rnComponentContext.customWrappedCustomRNComponentBuilder !== undefined) {
    ctx.rnComponentContext.customWrappedCustomRNComponentBuilder!.builder(ctx)
  }
}

const wrappedCustomRNComponentBuilder = wrapBuilder(buildCustomRNComponent)


/**
 * RNApp is a high-level component for embedding a React Native (RN) application in pure RN application projects.
 * In hybrid native-RN projects with multiple RN surfaces/roots, consider using the `RNSurface` component. By using
 * `RNSurface`, RN_APP_DEVELOPER takes over RNApp responsibilities.
 *
 * ### Responsibilities
 * - Displays `RNSurface` after loading a JS bundle.
 * - Integrates features that improve DevEx:
 *   - displaying logs and errors in `LogBoxDialog`,
 *   - reloading the RN application and displaying bundle loading progress in `RNDevLoadingView`,
 *   - displaying `RNPauseInDebuggerDialog` on a request by the debugger.
 * - Creates and destroys `RNInstance`, if `ManagedRNInstanceConfig` is provided.
 *
 * ### Performance Considerations
 * To improve startup performance, consider:
 *  - Providing an initialized RNInstance (see `UnmanagedRNInstanceConfig`)
 *  - Preloading the JS bundle, if the Hermes JS engine and HBC bundle aren't used
 *
 * ### Requirements
 * This component implicitly requires `RNOHCoreContext` to be set in the `AppStorage`.
 * If `RNAbility` isn't used, RN_APP_DEVELOPER must register `RNOHCoreContext` in `AppStorage`.
 *
 * @actor RNOH_APP
 */
@Component
@Preview
export struct XRNApp {
  /**
   * Bundle 名
   */
  public bundleName: string = ''
  /**
   * Configuration object for the RNInstance.
   * @see RNInstanceConfig
   */
  @Require public rnInstanceConfig!: RNInstanceConfig;
  /**
   * The app key registered in React Native via `AppRegistry.registerComponent`.
   */
  @Require public appKey: string = '';
  /**
   * Initial props to pass to the root React Native component on surface creation.
   * They can be retrieved in RN application from appParams provided to the wrapper component provider callback
   * `AppRegistry.setWrapperComponentProvider`.
   */
  public initialProps: Record<string, string> = {};
  /**
   * @see JSBundleProvider
   * If omitted, the RN_APP_DEVELOPER take the responsibility for loading a bundle into an RNInstance.
   * Some RN_APP_DEVELOPERS may prefer to control bundle loading without managing `RNInstance`.
   * In those situations, the bundle should be loaded in the `onSetUp` hook, as this is called during reloads.
   */
  public jsBundleProvider: JSBundleProvider | undefined = undefined;
  /**
   * Optional hook called once the RNInstance is created (or recreated after reloading) but before the surface is
   * rendered. Useful for configuring the instance or registering callbacks.
   */
  public onSetUp: (rnInstance: RNInstance) => Promise<void> | void = () => Promise.resolve();
  /**
   * Builder for injecting custom RN components defined on the ArkTS side.
   * Should only be used if a library has not migrated to `RNOHPackage` and provides ArkTS RN components.
   * Libraries should use `RNOHPackage` to register their ArkTS RN components.
   *
   * ### Context
   * Initially, in the RNOH ArkTS architecture, custom RN components were ArkUI components,
   * and RNApp accepted a `buildCustomComponent` builder (the name of this builder type was `CustomComponentBuilder`).
   * However, ArkTS RN components turned out to be too slow, and builders were faster. But at that time,
   * builders could not be injected into other builders. Hence, ArkTS introduced the `WrappedBuilder` concept.
   * However, `WrappedBuilder` wraps only `Builders` (not `BuilderParams`), so `buildCustomComponent`
   * had to be replaced with something new: `wrappedCustomRNComponentBuilder`.
   *
   * Builders were still not fast enough, so a new architecture (C-API) was introduced. However, ArkTS components still
   * had to be supported.
   *
   * Once performance was no longer the critical issue, autolinking support was introduced.
   * Autolinking introduced the `RNOHPackage.ets` class in favor of `RNPackage.ts`,
   * because `wrapBuilder` is only available in ETS files.
   *
   * As of the writing of this comment, many libraries have not yet migrated to RNOHPackage (and autolinking)
   * and RN_APP_DEVELOPERS need to manually link ArkTS RN components by using this property.
   *
   * @deprecated `RNOHPackage` should be used for registering custom components (from RNOH version 0.75.1).
   */
  public wrappedCustomRNComponentBuilder: WrappedCustomRNComponentBuilder | undefined = undefined;
  // -------------------------------------------------------------------------------------------------------------------
  /** Core RNOH context object from ArkTS runtime. */
  @StorageLink('RNOHCoreContext') private rnohCoreContext: RNOHCoreContext | undefined = undefined;
  /** Internal RNInstance used to manage the RN surface lifecycle. */
  private rnInstance!: RNInstance;
  /** Whether to show the rendered surface or not. */
  @State private shouldShow: boolean = false;
  /** Debug log box controller for showing RN warnings and errors. */
  private logBoxDialogController!: CustomDialogController;
  /** Controller for debugger pause dialog (only in debug mode). */
  private pauseDebuggerDialogController!: CustomDialogController;
  /** Indicates whether this component should clean up the RNInstance on unmount. */
  private isManagingRNInstance: boolean = false;

  /** Stores teardown callbacks for event listeners and resource cleanup. */
  private cleanUpCallbacks: (() => void)[] = [];
  /** Logger instance specific to RNApp. */
  private logger!: RNOHLogger;
  /** Internal RNComponentContext used by RNSurface. */
  private ctx!: RNComponentContext;

  public onReload?: (rnInstance: RNInstance, reason?: string) => Promise<void> | void

  /**
   * Lifecycle hook triggered when the component appears.
   * Initializes RNInstance and sets up the surface.
   */
  aboutToAppear(): void {
    this.init()
  }

  /**
   * Lifecycle hook triggered when the component disappears.
   * Cleans up resources, stops the RNInstance if necessary.
   */
  aboutToDisappear() {
    this.cleanUp()
  }

  /**
   * Reloads the RN application and resets all related state.
   * Used for development tooling like "Reload JS".
   */
  async reloadApp() {
    try {
      this.shouldShow = false
      if (this.isManagingRNInstance) {
        this.cleanUpCallbacks.forEach(cleanUp => cleanUp())
        const options = this.rnInstanceConfig
        this.rnInstance = await this.rnohCoreContext!.reloadRNInstance(this.rnInstance);
        await this.setUpSurfaceAndContext();
      }
    }
    catch (err) {
      if (err instanceof RNOHError) {
        this.rnohCoreContext!.reportRNOHError(err)
      } else if (typeof err === "string") {
        this.rnohCoreContext!.logger.error(err)
      } else if (err instanceof Error) {
        this.rnohCoreContext!.logger.error(err.message)
      } else {
        this.rnohCoreContext!.logger.error("Fatal exception")
      }
    }
  }

  private async setUpSurfaceAndContext() {
    this.ctx = new RNComponentContext(
      RNOHContext.fromCoreContext(this.rnohCoreContext, this.rnInstance),
      wrappedCustomRNComponentBuilder,
      wrapBuilder(buildRNComponentForTag),
      new Map(),
      this.wrappedCustomRNComponentBuilder // backward compatibility
    )

    // Initialize log box dialog for RN error/warning messages
    this.logBoxDialogController = new CustomDialogController({
      cornerRadius: 0,
      customStyle: true,
      alignment: DialogAlignment.TopStart,
      backgroundColor: Color.Transparent,
      builder: LogBoxDialog({
        ctx: this.ctx,
        rnInstance: this.rnInstance,
        initialProps: this.initialProps
      })
    })

    // Subscribe to log box and reload events
    this.cleanUpCallbacks.push(this.rnInstance.getTurboModule<LogBoxTurboModule>(LogBoxTurboModule.NAME).eventEmitter.subscribe("SHOW",
      () => this.logBoxDialogController.open()))
    this.cleanUpCallbacks.push(this.rnInstance.getTurboModule<LogBoxTurboModule>(LogBoxTurboModule.NAME).eventEmitter.subscribe("HIDE",
      () => this.logBoxDialogController.close()))
    this.cleanUpCallbacks.push(this.ctx.devToolsController.eventEmitter.subscribe("RELOAD", async () => {
      await this.reloadApp();
    }))
    this.rnInstance.subscribeToLifecycleEvents('RELOAD', async (data) => {
      if (this.onReload) {
        await this.onReload(this.rnInstance, data.reason)
      } else {
        await this.cleanUp()
        this.init()
      }
    })

    // Call user-defined setup logic
    await this.onSetUp(this.rnInstance)

    updateJSBundleProviderAppKeys(this.jsBundleProvider, BundleInfoManager.INSTANCE.getBundleInfo(this.bundleName)?.getModuleNames())

    // Run bundle if needed
    const jsBundleExecutionStatus = this.rnInstance.getBundleExecutionStatus(this.jsBundleProvider?.getURL())
    if (this.jsBundleProvider && jsBundleExecutionStatus === undefined) {
      if (this.rnInstance instanceof XRNInstanceImpl) {
        const localBundleInfo = BundleInfoManager.INSTANCE.getBundleInfo(this.bundleName)
        if(localBundleInfo) {
          this.rnInstance.setBundleInfo(localBundleInfo)
        }
      }
      await this.rnInstance.runJSBundle(this.jsBundleProvider)
      this.shouldShow = true
      return;
    }

    // Wait until bundle execution completes
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
  }

  /**
   * Initializes the RNInstance and sets up RNSurface and related behaviors.
   */
  private async init() {
    this.logger = this.rnohCoreContext!.logger.clone("RNApp")
    const stopTracing = this.logger.clone("init").startTracing()

    const bundleInfo = BundleInfoManager.INSTANCE.getBundleInfo(this.bundleName)
    bundleInfo?.addAppKey(this.appKey)

    try {
      await (async () => {
        this.rnInstance = await this.getOrCreateRNInstance()
        this.setUpSurfaceAndContext()
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

  /**
   * Destroys the RNInstance if owned, and cleans up all event listeners.
   */
  private async cleanUp() {
    const stopTracing = this.logger.clone("cleanUp").startTracing()
    this.shouldShow = false
    if (this.isManagingRNInstance) {
      await this.rnohCoreContext!.destroyAndUnregisterRNInstance(this.rnInstance)
    }
    this.cleanUpCallbacks.forEach(cleanUp => cleanUp())
    stopTracing()
  }

  /**
   * Returns a managed or unmanaged RNInstance depending on the config.
   */
  private getOrCreateRNInstance(): Promise<RNInstance> {
    if (Object.keys(this.rnInstanceConfig).includes("rnInstance")) {
      return Promise.resolve((this.rnInstanceConfig as UnmanagedRNInstanceConfig).rnInstance)
    } else {
      const options = this.rnInstanceConfig
      this.isManagingRNInstance = true
      return this.rnohCoreContext!.createAndRegisterRNInstance(options as ManagedRNInstanceConfig)
    }
  }

  /**
   * Renders the layout and underlying RNSurface.
   * Automatically inserts debugger overlays when in debug mode.
   */
  build() {
    if (this.shouldShow) {
      Stack() {
        if (this.rnohCoreContext!.isDebugModeEnabled) {
          RNPauseInDebuggerDialog({ ctx: this.ctx })
        }
        if (this.rnohCoreContext!.isDebugModeEnabled) {
          RNPerfMonitorView({ ctx: this.rnohCoreContext, rnInstance: this.rnInstance });
        }
        RNSurface({
          ctx: this.ctx,
          surfaceConfig: {
            initialProps: this.initialProps ?? {},
            appKey: this.appKey,
          },
        })
      if (this.rnohCoreContext!.isDebugModeEnabled) {
        RNDevLoadingView({ useSafeAreaInsets: true, ctx: this.rnohCoreContext }).position({ x: 0, y: 0 })
      }
      }
//      .expandSafeArea([SafeAreaType.KEYBOARD])
      .hitTestBehavior(HitTestMode.Transparent)
      .width("100%")
      .height("100%")
    }
  }
}
