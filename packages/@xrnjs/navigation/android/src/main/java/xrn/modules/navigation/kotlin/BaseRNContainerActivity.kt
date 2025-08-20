package xrn.modules.navigation.kotlin

import android.content.Intent
import xrn.modules.multibundle.view.RNContainerActivity
import xrn.modules.navigation.kotlin.bean.NavigationStateHolder

open class BaseRNContainerActivity : RNContainerActivity(), NavigationStateHolderProvider {

    private lateinit var mNavigationStateHolder: NavigationStateHolder

    override fun initData(intent: Intent?) {
        super.initData(intent)
        mNavigationStateHolder = NavigationStateHolder(mBundleName, mModuleName)
    }

    override fun getNavigationStateHolder(): NavigationStateHolder {
        return mNavigationStateHolder
    }

}