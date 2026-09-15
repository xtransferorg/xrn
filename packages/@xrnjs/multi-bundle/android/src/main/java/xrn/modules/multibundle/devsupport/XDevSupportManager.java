package xrn.modules.multibundle.devsupport;

import android.annotation.SuppressLint;
import android.content.Context;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;


import com.blankj.utilcode.util.Utils;
import com.facebook.react.ReactHost;
import com.facebook.react.bridge.JSBundleLoader;
import com.facebook.react.bridge.JSBundleLoaderDelegate;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.UiThreadUtil;
import com.facebook.react.common.DebugServerException;
import com.facebook.react.common.SurfaceDelegateFactory;
import com.facebook.react.devsupport.DevServerHelper;
import com.facebook.react.devsupport.DevSupportManagerBase;
import com.facebook.react.devsupport.HMRClient;
import com.facebook.react.devsupport.ReactInstanceDevHelper;
import com.facebook.react.devsupport.interfaces.DevBundleDownloadListener;
import com.facebook.react.devsupport.interfaces.DevLoadingViewManager;
import com.facebook.react.devsupport.interfaces.DevSplitBundleCallback;
import com.facebook.react.devsupport.interfaces.PackagerStatusCallback;
import com.facebook.react.devsupport.interfaces.PausedInDebuggerOverlayManager;
import com.facebook.react.devsupport.interfaces.RedBoxHandler;
import com.facebook.react.packagerconnection.PackagerConnectionSettings;
import com.facebook.react.packagerconnection.RequestHandler;

import java.lang.reflect.Field;
import java.util.Map;

import xrn.modules.multibundle.ReactHostManager;
import xrn.modules.multibundle.runtime.JSBundleType;
import xrn.modules.multibundle.runtime.XRNReactHostDelegate;

// 继承至BridgeDevSupportManager
public class XDevSupportManager extends DevSupportManagerBase {
    private String mBundleName = "";

    private ReactHost mReactHost;

    public XDevSupportManager(String bundleName, Context applicationContext, ReactInstanceDevHelper reactInstanceDevHelper, @Nullable String packagerPathForJSBundleName, boolean enableOnCreate, @Nullable RedBoxHandler redBoxHandler, @Nullable DevBundleDownloadListener devBundleDownloadListener, int minNumShakes, @Nullable Map<String, RequestHandler> customPackagerCommandHandlers, @Nullable SurfaceDelegateFactory surfaceDelegateFactory, @Nullable DevLoadingViewManager devLoadingViewManager, @Nullable PausedInDebuggerOverlayManager pausedInDebuggerOverlayManager) {
        super(applicationContext, reactInstanceDevHelper, packagerPathForJSBundleName, enableOnCreate, redBoxHandler, devBundleDownloadListener, minNumShakes, customPackagerCommandHandlers, surfaceDelegateFactory, devLoadingViewManager, pausedInDebuggerOverlayManager);

        mBundleName = bundleName;
        try {
            XRNDeveloperSettings.Listener listenerLocal = XDevSupportManager.this::reloadSettings;
            XRNDeveloperSettings mDevInternalSettings = new XRNDeveloperSettings(applicationContext, bundleName, listenerLocal);
            Field devSettingsFiled = DevSupportManagerBase.class.getDeclaredField("mDevSettings");
            devSettingsFiled.setAccessible(true);
            devSettingsFiled.set(this, mDevInternalSettings);

            PackagerConnectionSettings packagerConnectionSettings = new XRNPackageConnectionSettings(applicationContext, bundleName);
            DevServerHelper devServerHelper = new XRNDevServerHelper(bundleName, mDevInternalSettings, applicationContext, packagerConnectionSettings);
            Field devServerHelperFiled = DevSupportManagerBase.class.getDeclaredField("mDevServerHelper");
            devServerHelperFiled.setAccessible(true);
            devServerHelperFiled.set(this, devServerHelper);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    public void setReactHost(ReactHost reactHost) {
        mReactHost = reactHost;
    }

    @Override
    public void isPackagerRunning(PackagerStatusCallback callback) {
        super.isPackagerRunning(b -> {
            packagerRunningStatus = b;
            callback.onPackagerStatusFetched(b);
        });
    }

    private boolean packagerRunningStatus = false;

    public boolean getPackagerRunningStatus() {
        return packagerRunningStatus;
    }

    protected String getUniqueTag() {
        return "Bridge";
    }

    public void loadSplitBundleFromServer(@NonNull final String bundlePath, @NonNull final DevSplitBundleCallback callback) {
        this.fetchSplitBundleAndCreateBundleLoader(bundlePath, new DevSupportManagerBase.CallbackWithBundleLoader() {
            public void onSuccess(JSBundleLoader bundleLoader) {
                try {
                    XDevSupportManager.this.mReactInstanceDevHelper.loadBundle(bundleLoader).waitForCompletion();
                    String bundleURL = XDevSupportManager.this.getDevServerHelper().getDevServerSplitBundleURL(bundlePath);
                    ReactContext reactContext = XDevSupportManager.this.mReactInstanceDevHelper.getCurrentReactContext();
                    if (reactContext != null) {
                        ((HMRClient) reactContext.getJSModule(HMRClient.class)).registerBundle(bundleURL);
                    }

                    callback.onSuccess();
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                    throw new RuntimeException("[BridgelessDevSupportManager]: Got interrupted while loading bundle", e);
                }
            }

            public void onError(String url, Throwable cause) {
                callback.onError(url, cause);
            }
        });
    }

    public void handleReloadJS() {
        UiThreadUtil.assertOnUiThread();
        this.hideRedboxDialog();
        this.mReactInstanceDevHelper.reload("BridgelessDevSupportManager.handleReloadJS()");
    }

    @SuppressLint("VisibleForTests")
    public void setDebugServerHostPort(int hostPort) {
        XRNPackageConnectionSettings settings = (XRNPackageConnectionSettings) getDevSettings().getPackagerConnectionSettings();
        settings.setDebugServerHost(settings.getDebugServerIP() + ":" + hostPort);
    }

    public class SplitBundleDebugLoader extends JSBundleLoader {
        XRNReactHostDelegate reactHostDelegate = ReactHostManager.INSTANCE.getReactHostDelegate(mBundleName);

        public SplitBundleDebugLoader() {
        }

        JSBundleLoader bundleLoader =
                JSBundleLoader.createCachedBundleFromNetworkLoader(
                        getSourceUrl(), getDownloadedJSBundleFile());

        @Override
        public String loadScript(JSBundleLoaderDelegate delegate) {
            try {
                if (reactHostDelegate.isSplitMode()) {
                    String commonJSBundleFile = reactHostDelegate.getJSBundleFile(JSBundleType.COMMON);
                    delegate.loadScriptFromAssets(Utils.getApp().getAssets(), commonJSBundleFile, false);
                }

                return bundleLoader.loadScript(delegate);
            } catch (Exception e) {
                throw DebugServerException.makeGeneric(getSourceUrl(), e.getMessage(), e);
            }
        }
    }

}
