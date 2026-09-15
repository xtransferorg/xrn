package xrn.modules.loading.internal

import android.app.Activity
import android.app.Dialog
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import androidx.fragment.app.DialogFragment
import com.blankj.utilcode.util.BarUtils
import xrn.modules.loading.R
import java.lang.ref.WeakReference

class ErrorBoundaryDialogFragment : DialogFragment() {

    private var mHintText = ""
    private var mButtonText = ""
    private var mButtonClickListener: View.OnClickListener? = null
    private var mBackClickListener: View.OnClickListener =
        View.OnClickListener { dismissAllowingStateLoss() }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setStyle(STYLE_NORMAL, R.style.FullScreenDialogTheme)
    }

    override fun onCreateDialog(savedInstanceState: Bundle?): Dialog {
        val dialog: Dialog = object : Dialog(requireContext(), theme) {
            override fun onBackPressed() {
                mBackClickListener.onClick(null)
            }
        }

        dialog.setCancelable(false)
        dialog.setCanceledOnTouchOutside(false)

        return dialog
    }

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View? {
        return inflater.inflate(R.layout.dialog_error_boundary, container, false)
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        BarUtils.transparentNavBar(dialog!!.window!!)
        BarUtils.transparentStatusBar(dialog!!.window!!)

        view.setPadding(0, BarUtils.getStatusBarHeight(), 0, 0)

        view.findViewById<View>(R.id.iv_back).setOnClickListener(mBackClickListener)
        view.findViewById<TextView>(R.id.tv_hint).run {
            text = mHintText
        }
        view.findViewById<TextView>(R.id.tv_button).run {
            text = mButtonText
            setOnClickListener(mButtonClickListener)
        }
    }

    fun setHintText(hint: String) {
        mHintText = hint
    }

    fun setButtonText(buttonText: String) {
        mButtonText = buttonText
    }

    fun setButtonClickListener(listener: View.OnClickListener) {
        mButtonClickListener = listener
    }

    fun setBackClickListener(listener: View.OnClickListener) {
        mBackClickListener = listener
    }

    companion object {
        private val TAG = ErrorBoundaryDialogFragment::class.simpleName

        private var lastAttachedActivityRef: WeakReference<Activity>? = null

        fun show(
            activity: Activity?,
            hintText: String,
            buttonText: String,
            buttonClickListener: View.OnClickListener,
            backClickListener: View.OnClickListener? = null
        ) {
            if (activity == null) {
                return
            }

            lastAttachedActivityRef = WeakReference(activity)

            ThreadUtils.runOnUiThread {
                var dialogFragment = requireDialogFragment(activity)

                if (dialogFragment == null || !dialogFragment.isAdded) {
                    dialogFragment = ErrorBoundaryDialogFragment()
                    dialogFragment.setHintText(hintText)
                    dialogFragment.setButtonText(buttonText)
                    dialogFragment.setButtonClickListener(buttonClickListener)
                    if (backClickListener != null) {
                        dialogFragment.setBackClickListener(backClickListener)
                    }

                    (activity as AppCompatActivity)
                        .supportFragmentManager
                        .beginTransaction()
                        .add(dialogFragment, TAG)
                        .commitAllowingStateLoss()
                }
            }
        }

        fun dismiss() {
            ThreadUtils.runOnUiThread {
                val lastAttachedActivity = lastAttachedActivityRef?.get() ?: return@runOnUiThread
                requireDialogFragment(lastAttachedActivity)?.dismissAllowingStateLoss()
                lastAttachedActivityRef = null
            }
        }

        private fun requireDialogFragment(activity: Activity): ErrorBoundaryDialogFragment? {
            return (activity as AppCompatActivity)
                .supportFragmentManager
                .findFragmentByTag(TAG) as ErrorBoundaryDialogFragment?
        }

    }

}