package com.xrngo;

import android.content.Intent;
import android.os.Bundle;
import android.view.LayoutInflater;

import androidx.annotation.Nullable;
import androidx.appcompat.app.AppCompatActivity;

import com.blankj.utilcode.util.LogUtils;
import com.blankj.utilcode.util.ToastUtils;
import com.xrngo.databinding.ActivitySplashBinding;

import xrn.modules.navigation.kotlin.NavHelper;

public class MainActivity extends AppCompatActivity {

  @Override
  protected void onCreate(@Nullable Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    ActivitySplashBinding binding = ActivitySplashBinding.inflate(LayoutInflater.from(this));
    setContentView(binding.getRoot());
    binding.ivLogo.postDelayed(this::startXGoMainActivity, 500);
  }

  private void startXGoMainActivity() {

    Intent mainIntent = NavHelper.INSTANCE.buildMainModuleIntent(this, null);

    if (mainIntent == null) {
      LogUtils.e("跳转失败，主 Bundle 未注册！！！");
      ToastUtils.showLong("跳转失败，主 Bundle 未注册！！！");
    }
    startActivity(mainIntent);
    overridePendingTransition(0, 0);
    finish();
  }
}
