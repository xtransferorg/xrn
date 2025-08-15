package xrn.modules.debugtools.action

import android.app.Activity
import com.facebook.react.bridge.Promise

interface IVisulation {
    fun initConnection(activity: Activity?, host: String, port: String, room: String, promise: Promise);
}