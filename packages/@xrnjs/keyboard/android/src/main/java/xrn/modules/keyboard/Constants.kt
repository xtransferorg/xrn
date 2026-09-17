package xrn.modules.keyboard

object Constants {
    /**
     * resize 模式
     * 键盘弹起时，整个窗口重新计算高度
     */
    const val SOFT_INPUT_MODE_RESIZE = "resize"

    /**
     * pan 模式
     * 键盘弹起时，整个窗口上移，确保输入框是露出的
     */
    const val SOFT_INPUT_MODE_PAN = "pan"

    /**
     * auto 模式
     * 键盘弹起时，整个窗口上移，确保输入框是露出的，如果弹窗上移到顶部，剩下上移 distance 需要内部滚动组件消化
     */
    const val SOFT_INPUT_MODE_AUTO = "auto"

    /**
     * 输入法和输入框之间的默认间隔
     */
    const val DEFAULT_SOFT_INPUT_SPACE = 29

    /**
     * 用于标识弹窗内容区域根组件
     * 在 RN 侧 Keyboard.Content 组件中 nativeID 值保持一致
     * 原生侧通过该值查找原生对应的组件
     */
    const val NATIVE_ID_KEYBOARD_CONTENT = "keyboard_content_native_id"

    /**
     * 用于标识 auto 模式下，可滚动组件
     * RN 侧需要在可滚动节点配置 nativeID = softInputMode_auto_mode_scrollable_tag
     */
    const val NATIVE_ID_KEYBOARD_SCROLLABLE_VIEW_TAG = "softInputMode_auto_mode_scrollable_tag"
}