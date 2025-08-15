package xrn.modules.loading.internal

import android.annotation.SuppressLint
import android.app.Dialog
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.ProgressBar
import android.widget.TextView
import androidx.fragment.app.DialogFragment
import com.XRNLoadingModule.R
import com.blankj.utilcode.util.BarUtils

class LoadingDialogFragment : DialogFragment() {
    private lateinit var mProgressBar: ProgressBar
    private lateinit var mHintTextView: TextView

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setStyle(STYLE_NORMAL, R.style.FullScreenDialogTheme)
    }

    override fun onCreateDialog(savedInstanceState: Bundle?): Dialog {
        val dialog: Dialog = object : Dialog(requireContext(), theme) {
            override fun onBackPressed() {
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
        return inflater.inflate(R.layout.dialog_loading, container, false)
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        BarUtils.transparentNavBar(dialog!!.window!!)
        BarUtils.transparentStatusBar(dialog!!.window!!)

        mProgressBar = view.findViewById(R.id.progress_bar)
        mHintTextView = view.findViewById(R.id.tv_loading_hint)
    }

    @SuppressLint("SetTextI18n")
    fun updateProgress(progress: Int) {
        mProgressBar.progress = progress
        mProgressBar.visibility = View.VISIBLE
        mHintTextView.text = "loading...$progress%"
        mHintTextView.visibility = View.VISIBLE
    }
}