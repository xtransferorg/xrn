//
//  CacheTool.swift
//  xtapp
//
//  Created by  xtgq on 2024/12/12.
//  Copyright © 2024 Facebook. All rights reserved.
//

import Foundation

class CacheTool: NSObject {
    
    static let shared = CacheTool()
    
    func clearCachesDirectory() {
        let fileManager = FileManager.default
        if let cacheDir = fileManager.urls(for: .cachesDirectory, in: .userDomainMask).first {
            do {
                let filePaths = try fileManager.contentsOfDirectory(at: cacheDir, includingPropertiesForKeys: nil)
                for filePath in filePaths {
                    try fileManager.removeItem(at: filePath)
                }
                print("clearCachesDirectory缓存数据清除成功")
            } catch {
                print("clearCachesDirectory缓存数据清除失败: \(error.localizedDescription)")
            }
        }
    }
    
    func clearTemporaryDirectory() {
        let tempDir = FileManager.default.temporaryDirectory
        do {
            let filePaths = try FileManager.default.contentsOfDirectory(at: tempDir, includingPropertiesForKeys: nil, options: [])
            for filePath in filePaths {
                try FileManager.default.removeItem(at: filePath)
            }
            print("clearTemporaryDirectory缓存数据清除成功")
        } catch {
            print("clearTemporaryDirectory缓存数据清除失败: \(error.localizedDescription)")
        }
    }
    
    func clearUserDefaults() {
        if let appDomain = Bundle.main.bundleIdentifier {
            UserDefaults.standard.removePersistentDomain(forName: appDomain)
            UserDefaults.standard.synchronize()
            print("clearUserDefaults缓存数据清除成功")
        }
    }
    
}
