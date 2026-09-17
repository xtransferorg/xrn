package xrn.modules.loading.internal

import android.animation.Animator
import android.annotation.SuppressLint
import android.app.Dialog
import android.graphics.Color
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.view.WindowManager
import android.widget.ProgressBar
import android.widget.TextView
import androidx.annotation.FloatRange
import androidx.core.graphics.drawable.toDrawable
import androidx.fragment.app.DialogFragment
import com.airbnb.lottie.LottieAnimationView
import com.blankj.utilcode.util.BarUtils
import com.blankj.utilcode.util.SizeUtils
import xrn.modules.loading.R

class SplashDialogFragment : DialogFragment() {

    private lateinit var mLottieAnimationView: LottieAnimationView
    private lateinit var mProgressContainer: ViewGroup
    private lateinit var mProgressBar: ProgressBar
    private lateinit var mTvPercent: TextView

    internal var isAnimationEnd = false

    var isForceLastScreen = true

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
        inflater: LayoutInflater, container: ViewGroup?, savedInstanceState: Bundle?
    ): View? {
        return inflater.inflate(R.layout.dialog_splash, container, false)
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        BarUtils.transparentNavBar(dialog!!.window!!)
        BarUtils.transparentStatusBar(dialog!!.window!!)

        mLottieAnimationView = view.findViewById(R.id.lav_splash_lottie)
        mProgressContainer = view.findViewById(R.id.ll_progress)
        mProgressBar = view.findViewById(R.id.progress_bar)
        mTvPercent = view.findViewById(R.id.tv_percent)
        mLottieAnimationView.addAnimatorListener(object : Animator.AnimatorListener {
            override fun onAnimationStart(animation: Animator) {

            }

            override fun onAnimationEnd(animation: Animator) {
                isAnimationEnd = true
            }

            override fun onAnimationCancel(animation: Animator) {
            }

            override fun onAnimationRepeat(animation: Animator) {
            }
        })

        if (isForceLastScreen) {
            mLottieAnimationView.progress = 1F
        } else {
            mLottieAnimationView.playAnimation()
        }
    }

    override fun onStart() {
        super.onStart()
        dialog?.window?.run {
            setWindowAnimations(R.style.SplashNoAnimation)
            setBackgroundDrawable(Color.TRANSPARENT.toDrawable());
            clearFlags(WindowManager.LayoutParams.FLAG_DIM_BEHIND)
        }
    }

    @SuppressLint("SetTextI18n")
    fun updateProgress(progress: Int) {
        if (!isAnimationEnd) return

        mProgressContainer.visibility = View.VISIBLE
        mProgressBar.progress = progress

        val maxTranslationX = mProgressContainer.width - SizeUtils.dp2px(96F)
        mTvPercent.translationX = (progress / 100F) * maxTranslationX
        mTvPercent.text = "$progress%"
    }

}