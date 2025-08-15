//
//  XTPingTool.swift
//  xtapp
//
//  Created by  xtgq on 2025/3/20.
//  Copyright © 2025 Facebook. All rights reserved.
//

import Foundation


typealias XTPingCompletion = (_ hostName: String, _ time: TimeInterval, _ error: Error?) -> Void

class XTPingItem {
    var sequence: UInt16
    init(sequence: UInt16) {
        self.sequence = sequence
    }
}

class XTPingTool: NSObject {
    private var simplePing: SimplePing?
    private var pingItems: [XTPingItem] = []
    private var hostName: String
    private var pingCompletion: XTPingCompletion
    private var timer: Timer?
    private var beginDate: Date?
    private var singleInvocation = false

    init(hostName: String, completion: @escaping XTPingCompletion) {
        self.hostName = hostName
        self.pingCompletion = completion
        super.init()
        
        self.simplePing = SimplePing(hostName: hostName)
        self.simplePing?.delegate = self
        self.simplePing?.addressStyle = .any
    }

    deinit {
        stopPing()
    }

    func startPing() {
        simplePing?.start()
    }

    func isPinging() -> Bool {
        return timer?.isValid ?? false
    }

    func stopPing() {
        timer?.invalidate()
        timer = nil
        simplePing?.stop()
    }

    private func actionTimer() {
        timer?.invalidate()
        timer = Timer.scheduledTimer(timeInterval: 1.0, target: self, selector: #selector(sendPingData), userInfo: nil, repeats: true)
    }

    @objc private func sendPingData() {
        simplePing?.send(with: nil)
    }
}

// MARK: - SimplePingDelegate
extension XTPingTool: SimplePingDelegate {
    
    func simplePing(_ pinger: SimplePing, didStartWithAddress address: Data) {
        print("开始ping")
        actionTimer()
    }

    func simplePing(_ pinger: SimplePing, didFailWithError error: Error) {
        print("hostname:\(hostName), ping失败--->\(error)")
        if !singleInvocation {
            pingCompletion(hostName, 0, error)
            singleInvocation = true
        }
    }

    func simplePing(_ pinger: SimplePing, didSendPacket packet: Data, sequenceNumber: UInt16) {
        let item = XTPingItem(sequence: sequenceNumber)
        pingItems.append(item)
        beginDate = Date()

        DispatchQueue.main.asyncAfter(deadline: .now() + 1.5) {
            if self.pingItems.contains(where: { $0.sequence == sequenceNumber }) {
                self.stopPing()
                print("hostname:\(self.hostName), 超时")
                self.pingItems.removeAll(where: { $0.sequence == sequenceNumber })
                if !self.singleInvocation {
                    self.pingCompletion(self.hostName, 0, NSError(domain: NSURLErrorDomain, code: 111, userInfo: nil))
                    self.singleInvocation = true
                }
            }
        }
    }

    func simplePing(_ pinger: SimplePing, didFailToSendPacket packet: Data, sequenceNumber: UInt16, error: Error) {
        print("hostname:\(hostName), 发包失败--->\(error)")
        if !singleInvocation {
            pingCompletion(hostName, 0, error)
            singleInvocation = true
        }
    }

    func simplePing(_ pinger: SimplePing, didReceivePingResponsePacket packet: Data, sequenceNumber: UInt16) {
        guard let beginDate = beginDate else { return }
      
        let delayTime = Date().timeIntervalSince(beginDate) * 1000

        pingItems.removeAll { $0.sequence == sequenceNumber }

        print("hostname:\(hostName), 接受成功--->\(delayTime)ms")
        stopPing()
        if !singleInvocation {
            pingCompletion(hostName, delayTime, nil)
            singleInvocation = true
        }
    }
  
}
