package com.xrngo.demo

import android.app.Activity
import android.content.Context
import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.RecyclerView
import com.xrngo.databinding.ItemMultiBundleBinding
import xrn.modules.multibundle.bundle.BundleInfo
import xrn.modules.multibundle.bundle.BundleInfoManager
import xrn.modules.navigation.kotlin.NavHelper

class MultiBundleAdapter(val activity: Activity): RecyclerView.Adapter<MultiBundleAdapter.BundleViewHolder>() {

    private val layoutInflater = LayoutInflater.from(activity)


    private val bundleInfoList = BundleInfoManager.getAllBundleInfo()


    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): BundleViewHolder {
        val binding = ItemMultiBundleBinding.inflate(layoutInflater)
        return BundleViewHolder(activity, binding)
    }

    override fun getItemCount(): Int {
        return bundleInfoList.size
    }

    override fun onBindViewHolder(holder: BundleViewHolder, position: Int) {
        val info = bundleInfoList[position]
        holder.update(position, info)
    }

    class BundleViewHolder(val activity: Activity, val binding: ItemMultiBundleBinding): RecyclerView.ViewHolder(binding.root) {

        private var index = -1
        private var info: BundleInfo? = null

        fun update(index: Int, info: BundleInfo?) {
            this.index = index
            this.info = info
            binding.tvBundleName.text = "bundle-${index + 1} 名称：${info?.bundleName}"
            binding.tvBundleType.text = "类型：${if (info?.isMainBundle() == true) "主" else "普通"}Bundle"
            binding.tvBundleCodePushKey.text = "codePushKey：${info?.getCodePushKey()}"
            binding.tvBundleLocalServerPort.text = "本地服务端口：${info?.getPort()}"
            binding.root.setOnClickListener {
                NavHelper.jump2Module(activity, info?.bundleName ?: "", info?.bundleName, "")
            }
        }
    }
}