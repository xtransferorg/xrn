package com.xrngo.demo

import android.os.Bundle
import android.view.LayoutInflater
import androidx.appcompat.app.AppCompatActivity
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.xrngo.R
import com.xrngo.databinding.ActivityMultiBundleBinding

class MultiBundleActivity: AppCompatActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val binding = ActivityMultiBundleBinding.inflate(LayoutInflater.from(this))
        setContentView(binding.root)

        initViews(binding)
    }

    private fun initViews(binding: ActivityMultiBundleBinding) {
        binding.rvBundle.layoutManager = LinearLayoutManager(this, RecyclerView.VERTICAL, false)
        binding.rvBundle.adapter = MultiBundleAdapter(this)
    }
}