//
//  XTBundlePreloadQueue.m
//  react-native-xrn-multi-bundle
//
//  Created by  xtgq on 2026/1/16.
//

#import "XTBundlePreloadQueue.h"
#import "XTJSBridgePool.h"
#import "XTJSRuntimeContext.h"

@interface XTBundlePreloadQueue ()

@property (nonatomic, strong) NSMutableArray<NSString *> *taskQueue;

@property (nonatomic, assign) BOOL isExecuting;

@property (nonatomic, copy, nullable) NSString *currentLoadingBundle;

@property (nonatomic, strong) dispatch_queue_t serialQueue;

@property (nonatomic, strong, nullable) dispatch_source_t timeoutSource;

@end

@implementation XTBundlePreloadQueue

#pragma mark - Singleton

+ (instancetype)shared {
  static XTBundlePreloadQueue *instance = nil;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    instance = [[XTBundlePreloadQueue alloc] init];
  });
  return instance;
}

- (instancetype)init {
  self = [super init];
  if (self) {
    _taskQueue = [NSMutableArray array];
    _isExecuting = NO;
    _timeoutInterval = 30.0;
    _serialQueue = dispatch_queue_create("com.xt.bundle.preload.queue", DISPATCH_QUEUE_SERIAL);
    
    // 监听 bundle 加载完成通知
    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(handleBundleDidLoad:)
                                                 name:XTBizBundleLoadSuccessNotification
                                               object:nil];
    
    CPLog2(@"[PreloadQueue] 队列管理器已初始化");
  }
	
  return self;
}

- (void)dealloc {
  [[NSNotificationCenter defaultCenter] removeObserver:self];
	
  [self cancelTimeoutCheck];
  CPLog2(@"[PreloadQueue] 队列管理器已释放");
}

#pragma mark - Public Methods

- (void)enqueuePreloadTask:(NSString *)bundleName {
	
  if (!bundleName || bundleName.length == 0) {
    CPLog2(@"[PreloadQueue] Bundle 名称无效");
    return;
  }
  
  dispatch_sync(self.serialQueue, ^{
		
    // 避免重复添加
    if ([self.taskQueue containsObject:bundleName]) {
      CPLog2(@"[PreloadQueue] Bundle %@ 已在队列中，跳过", bundleName);
      return;
    }
    
    // 避免添加正在加载的
    if ([bundleName isEqualToString:self.currentLoadingBundle]) {
      CPLog2(@"[PreloadQueue] Bundle %@ 正在加载中，跳过", bundleName);
      return;
    }
    
    [self.taskQueue addObject:bundleName];
    CPLog2(@"[PreloadQueue] 添加任务：%@，当前队列长度：%lu", bundleName, (unsigned long)self.taskQueue.count);
    
    // 如果队列未执行，立即启动
    if (!self.isExecuting) {
      CPLog2(@"[PreloadQueue] 队列未运行，立即启动");
      self.isExecuting = YES;
      
      dispatch_async(dispatch_get_main_queue(), ^{
        [self executeNextTask];
      });
    } else {
      CPLog2(@"[PreloadQueue] 队列运行中，任务已加入等待");
    }
  });
}

- (void)enqueuePreloadTasks:(NSArray<NSString *> *)bundleNames {
  if (!bundleNames || bundleNames.count == 0) {
    CPLog2(@"[PreloadQueue] Bundle 数组为空");
    return;
  }
  
  for (NSString *bundleName in bundleNames) {
    [self enqueuePreloadTask:bundleName];
  }
}

- (void)start {
  dispatch_async(self.serialQueue, ^{
    if (self.isExecuting) {
      CPLog2(@"[PreloadQueue] 队列正在执行中");
      return;
    }
    
    if (self.taskQueue.count == 0) {
      CPLog2(@"[PreloadQueue] 队列为空，无需启动");
      return;
    }
    
    CPLog2(@"[PreloadQueue] 手动启动队列，共 %lu 个任务", (unsigned long)self.taskQueue.count);
    self.isExecuting = YES;
    
    dispatch_async(dispatch_get_main_queue(), ^{
      [self executeNextTask];
    });
		
  });
}

- (void)clear {
  dispatch_sync(self.serialQueue, ^{
		
    NSUInteger clearedCount = self.taskQueue.count;
    [self.taskQueue removeAllObjects];
    self.currentLoadingBundle = nil;
    self.isExecuting = NO;
    [self cancelTimeoutCheck];
    CPLog2(@"[PreloadQueue] 队列已清空，清除了 %lu 个任务", (unsigned long)clearedCount);
  });
}

- (NSUInteger)remainingTaskCount {
  __block NSUInteger count = 0;
  dispatch_sync(self.serialQueue, ^{
    count = self.taskQueue.count;
  });
  return count;
}

#pragma mark - Private Methods

- (void)executeNextTask {
  dispatch_sync(self.serialQueue, ^{
		
    // 检查队列是否为空
    if (self.taskQueue.count == 0) {
      CPLog2(@"[PreloadQueue] 所有任务执行完成");
      self.isExecuting = NO;
      self.currentLoadingBundle = nil;
			// 取消超时检查
      [self cancelTimeoutCheck];
      return;
    }
    
    // 取出第一个任务
    NSString *bundleName = self.taskQueue.firstObject;
    [self.taskQueue removeObjectAtIndex:0];
    
    self.currentLoadingBundle = bundleName;
    
    CPLog2(@"[PreloadQueue] 开始预加载：%@ (剩余 %lu 个任务)", bundleName, (unsigned long)self.taskQueue.count);
    
    // 开始加载
    dispatch_async(dispatch_get_main_queue(), ^{
      [[XTJSBridgePool shared] preLoadBundle:bundleName];
      
      // 启动超时检查
      [self startTimeoutCheckForBundle:bundleName];
    });
		
  });
}

- (void)handleBundleDidLoad:(NSNotification *)notification {
  id contextObj = notification.userInfo[XTRuntimeNotificationContextKey];
  if (![contextObj isKindOfClass:[XTJSRuntimeContext class]]) {
    return;
  }

  NSString *loadedBundleName = [(XTJSRuntimeContext *)contextObj jsBundleName];
  if (loadedBundleName.length == 0) {
    return;
  }

  dispatch_sync(self.serialQueue, ^{
    // 检查是否是当前正在加载的 bundle
    if ([loadedBundleName isEqualToString:self.currentLoadingBundle]) {
      CPLog2(@"[PreloadQueue] Bundle 加载完成：%@", loadedBundleName);
      
      // 取消超时检查
      [self cancelTimeoutCheck];
      
      // 清空当前加载标记
      self.currentLoadingBundle = nil;
      
      // 执行下一个任务
      dispatch_async(dispatch_get_main_queue(), ^{
        [self executeNextTask];
      });
    }
  });
}

#pragma mark - Timeout Protection

- (void)startTimeoutCheckForBundle:(NSString *)bundleName {
  [self cancelTimeoutCheck];
  
  dispatch_queue_t queue = dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0);
  self.timeoutSource = dispatch_source_create(DISPATCH_SOURCE_TYPE_TIMER, 0, 0, queue);
  
  dispatch_source_set_timer(self.timeoutSource,
                            dispatch_time(DISPATCH_TIME_NOW, (int64_t)(self.timeoutInterval * NSEC_PER_SEC)),
                            DISPATCH_TIME_FOREVER,
                            (1ull * NSEC_PER_SEC) / 10);
  
  __weak typeof(self) weakSelf = self;
  dispatch_source_set_event_handler(self.timeoutSource, ^{
    __strong typeof(weakSelf) strongSelf = weakSelf;
    if (strongSelf) {
      [strongSelf handleTimeout:bundleName];
    }
  });
  
  dispatch_resume(self.timeoutSource);
}

- (void)cancelTimeoutCheck {
  if (self.timeoutSource) {
    dispatch_source_cancel(self.timeoutSource);
    self.timeoutSource = nil;
  }
}

- (void)handleTimeout:(NSString *)bundleName {
  dispatch_sync(self.serialQueue, ^{
    CPLog2(@"[PreloadQueue] Bundle 加载超时（%.0f秒）：%@", self.timeoutInterval, bundleName);
		
		// 取消超时检查
		[self cancelTimeoutCheck];
    
    // 超时后继续执行下一个
    if ([bundleName isEqualToString:self.currentLoadingBundle]) {
      self.currentLoadingBundle = nil;
      
      dispatch_async(dispatch_get_main_queue(), ^{
        [self executeNextTask];
      });
    }
  });
}

#pragma mark - Debug

- (NSString *)description {
  __block NSString *desc;
	
  dispatch_sync(self.serialQueue, ^{
    desc = [NSString stringWithFormat:@"<XTBundlePreloadQueue: isExecuting=%@, currentLoading=%@, remaining=%lu, queue=%@>",
            @(self.isExecuting),
            self.currentLoadingBundle ?: @"nil",
            (unsigned long)self.taskQueue.count,
            self.taskQueue];
  });
	
  return desc;
}

@end
