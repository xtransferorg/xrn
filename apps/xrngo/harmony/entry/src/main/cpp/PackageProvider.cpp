#include "RNOH/PackageProvider.h"
#include "generated/RNOHGeneratedPackage.h"
#include "CookiesPackage.h"
#include "AsyncStoragePackage.h"
#include "SVGPackage.h"
#include "ClipboardPackage.h"
#include "LottieAnimationViewPackage.h"
#include "SafeAreaViewPackage.h"
#include "SmartRefreshLayoutPackage.h"
#include "RNFSPackage.h"
#include "RNCVideoPackage.h"
#include "VisionCameraPackage.h"
#include "PushNotificationPackage.h"
#include "RNImagePickerPackage.h"
#include "RNCNetInfoPackage.h"
#include "FastImagePackage.h"
#include "GestureHandlerPackage.h"
#include "LinearGradientPackage.h"
#include "PermissionsPackage.h"
#include "ReanimatedPackage.h"
#include "PdfViewPackage.h"
// #include "BackgroundTimerPackage.h"
// #include "DocumentPickerPackage.h"
using namespace rnoh;

std::vector<std::shared_ptr<Package>> PackageProvider::getPackages(Package::Context ctx) {
    return {
        std::make_shared<RNOHGeneratedPackage>(ctx),
        std::make_shared<CookiesPackage>(ctx),
        std::make_shared<AsyncStoragePackage>(ctx),
        std::make_shared<ClipboardPackage>(ctx),
        std::make_shared<SVGPackage>(ctx),
        std::make_shared<SafeAreaViewPackage>(ctx),
        std::make_shared<SmartRefreshLayoutPackage>(ctx),
        std::make_shared<LottieAnimationViewPackage>(ctx),
        std::make_shared<RNFSPackage>(ctx),
        std::make_shared<RNCVideoPackage>(ctx),
        std::make_shared<VisionCameraPackage>(ctx),
        std::make_shared<PushNotificationPackage>(ctx),
        std::make_shared<RNImagePickerPackage>(ctx),
        std::make_shared<RNCNetInfoPackage>(ctx),
        std::make_shared<FastImagePackage>(ctx),
        std::make_shared<GestureHandlerPackage>(ctx),
        std::make_shared<LinearGradientPackage>(ctx),
        std::make_shared<PermissionsPackage>(ctx),
        std::make_shared<ReanimatedPackage>(ctx),
        std::make_shared<PdfViewPackage>(ctx),
//         std::make_shared<BackgroundTimerPackage>(ctx),
//         std::make_shared<DocumentPickerPackage>(ctx),
    };
}