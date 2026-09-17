package xrn.modules.keyboard.inputmethod.handler

import xrn.modules.keyboard.inputmethod.KeyboardContainer
import xrn.modules.keyboard.inputmethod.KeyboardView

interface IKeyboardTypeHandler: KeyboardView.KeyDrawListener,
    KeyboardView.OnKeyboardActionListener {

    var keyboardContainer: KeyboardContainer?

    /**
     * IKeyboardTypeHandler 从 KeyboardContainer 解绑时的回调
     * 用于清除数据
     */
    fun onDetach(keyboardContainer: KeyboardContainer?)

    /**
     * IKeyboardTypeHandler 和 KeyboardContainer 绑定时的回调
     * 用于绑定数据
     */
    fun onAttach(keyboardContainer: KeyboardContainer?)
}