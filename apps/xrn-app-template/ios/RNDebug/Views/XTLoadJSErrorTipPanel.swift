//
//  XTLoadJSErrorTipPanel.swift
//  XRNTemplate
//
//  Created by  xtgq on 2025/3/4.
//  Copyright © 2025 Facebook. All rights reserved.
//

import UIKit
import SnapKit

@objc final class XTLoadJSErrorTipPanel: UIViewController {
    
    @objc var bundleName: String = ""
    
    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = .white
        setupUI()
        
        subDesc.text = "\(bundleName) bundle已开启动态调试，但本地服务连接异常，可能是以下原因："
        ipTip.text = "3：ip不正确（当前绑定IP是：\(XTPluginManage.shareInstance().getLocalHost())， 如果IP不正确，直接重新扫码绑定ip即可）"
        
        cancleBtn.addTarget(self, action: #selector(cancleClick), for: .touchUpInside)
        scanBtn.addTarget(self, action: #selector(scanClick), for: .touchUpInside)
        exitApp.addTarget(self, action: #selector(exitClick), for: .touchUpInside)
        resetBundle.addTarget(self, action: #selector(resetBundleClick), for: .touchUpInside)
        resetBundle.setTitle("关闭\(bundleName)调试", for: .normal)
    }
    
    deinit {
        print("XTLoadJSErrorTipPanel deinit!")
    }
    
    private func setupUI() {
        view.addSubview(titleLabel)
        view.addSubview(cancleBtn)
        view.addSubview(subDesc)
        view.addSubview(serverTip)
        view.addSubview(wifiTip)
        view.addSubview(ipTip)
        view.addSubview(scanBtn)
        view.addSubview(jsErr)
        
        //    view.addSubview(exitApp)
        view.addSubview(resetBundle)
        
        titleLabel.snp.makeConstraints { make in
            make.top.equalTo(20)
            make.centerX.equalToSuperview()
        }
        
        cancleBtn.snp.makeConstraints { make in
            make.centerY.equalTo(titleLabel)
            make.right.equalTo(-20)
            make.width.equalTo(40)
            make.height.equalTo(40)
        }
        
        subDesc.snp.makeConstraints { make in
            make.top.equalTo(titleLabel.snp.bottom).offset(50)
            make.left.equalTo(20)
            make.right.equalTo(-20)
        }
        
        serverTip.snp.makeConstraints { make in
            make.top.equalTo(subDesc.snp.bottom).offset(50)
            make.left.equalTo(20)
            make.right.equalTo(-20)
        }
        
        wifiTip.snp.makeConstraints { make in
            make.top.equalTo(serverTip.snp.bottom).offset(30)
            make.left.equalTo(20)
            make.right.equalTo(-20)
        }
        
        ipTip.snp.makeConstraints { make in
            make.top.equalTo(wifiTip.snp.bottom).offset(30)
            make.left.equalTo(20)
            make.right.equalTo(-20)
        }
        
        scanBtn.snp.makeConstraints { make in
            make.top.equalTo(ipTip.snp.bottom).offset(30)
            make.centerX.equalToSuperview()
            make.width.equalTo(300)
            make.height.equalTo(45)
        }
        
        jsErr.snp.makeConstraints { make in
            make.top.equalTo(scanBtn.snp.bottom).offset(30)
            make.left.equalTo(20)
            make.right.equalTo(-20)
        }
        
        //    exitApp.snp.makeConstraints { make in
        //      make.left.equalToSuperview().offset(20)
        //      make.bottom.equalTo(-60)
        //      make.width.equalTo(140)
        //      make.height.equalTo(45)
        //    }
        
        resetBundle.snp.makeConstraints { make in
            make.left.equalToSuperview().offset(20)
            make.right.equalToSuperview().offset(-20)
            make.height.equalTo(45)
            make.bottom.equalTo(-60)
        }
        
    }
    
    @objc private func cancleClick() {
        self.dismiss(animated: true, completion: nil)
    }
    
    @objc private func exitClick() {
        exitAppFun()
    }
    
    @objc private func resetBundleClick() {
        UserDefaults.standard.removeObject(forKey: "\(bundleName)-debug")
        UserDefaults.standard.synchronize()
        exitAppFun()
    }
    
    @objc private func scanClick() {
#if DEBUG
        XTScanQRPlugin.shared.startScan()
#endif
    }
    
    private func exitAppFun() {
        //    let mainBridge = XTMultiBundleManager.shared().pool?.fetchJSBridge(withJSBundleName: "xt-app-main") as? RCTBridge
        //    if let bridge = mainBridge, let module = bridge.module(forName: "XRNAppUtilsModule") as? NSObject {
        //      module.perform(Selector(("exitApp")))
        //    }
        exit(0)
    }
    
    private lazy var titleLabel: UILabel = {
        let label = UILabel()
        label.text = "本地服务异常"
        label.textColor = .black
        label.font = UIFont.systemFont(ofSize: 16, weight: .bold)
        label.numberOfLines = 0
        return label
    }()
    
    private lazy var cancleBtn: UIButton = {
        let cancle = UIButton(type: .custom)
        cancle.setTitle("取消", for: .normal)
        cancle.setTitleColor(.black, for: .normal)
        cancle.titleLabel?.font = UIFont.systemFont(ofSize: 16, weight: .bold)
        return cancle
    }()
    
    private lazy var subDesc: UILabel = {
        let label = UILabel()
        label.text = ""
        label.textColor = .black
        label.font = UIFont.systemFont(ofSize: 18, weight: .bold)
        label.numberOfLines = 0
        return label
    }()
    
    private lazy var serverTip: UILabel = {
        let label = UILabel()
        label.text = "1：本地服务未开启（yarn start 启动本地服务）"
        label.textColor = .black
        label.font = UIFont.systemFont(ofSize: 16)
        label.numberOfLines = 0
        return label
    }()
    
    private lazy var wifiTip: UILabel = {
        let label = UILabel()
        label.text = "2：网络异常（检查手机WiFi连接是否正常，手机WiFi是否与电脑WiFi一致，手机WiFi是否设置了代理）"
        label.textColor = .black
        label.font = UIFont.systemFont(ofSize: 16)
        label.numberOfLines = 0
        return label
    }()
    
    private lazy var ipTip: UILabel = {
        let label = UILabel()
        label.text = ""
        label.textColor = .black
        label.font = UIFont.systemFont(ofSize: 16)
        label.numberOfLines = 0
        return label
    }()
    
    private lazy var scanBtn: UIButton = {
        let button = UIButton(type: .custom)
        button.setTitle("  扫码绑定IP", for: .normal)
        button.setImage(UIImage(named: "doraemon_scan"), for: .normal)
        button.setTitleColor(.white, for: .normal)
        button.backgroundColor = .orange
        button.layer.cornerRadius = 22
        return button
    }()
    
    private lazy var jsErr: UILabel = {
        let label = UILabel()
        label.text = "4：JS 执行报错（在终端检查是否有JS Error）"
        label.textColor = .black
        label.font = UIFont.systemFont(ofSize: 16)
        label.numberOfLines = 0
        return label
    }()
    
    private lazy var exitApp: UIButton = {
        let button = UIButton(type: .custom)
        button.setTitle("重启App", for: .normal)
        button.setTitleColor(.white, for: .normal)
        button.backgroundColor = .orange
        button.layer.cornerRadius = 22
        return button
    }()
    
    private lazy var resetBundle: UIButton = {
        let button = UIButton(type: .custom)
        button.setTitle("关闭调试", for: .normal)
        button.setTitleColor(.white, for: .normal)
        button.backgroundColor = .orange
        button.layer.cornerRadius = 22
        return button
    }()
    
}
