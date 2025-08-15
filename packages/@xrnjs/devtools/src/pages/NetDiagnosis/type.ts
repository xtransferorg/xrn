export interface NetDiagnosisInfo {
  appVersion: string;
  sysVersion: string;
  netType: string;
  netStatus: string;
  ping: PingInfo;
  netProxy: ProxyItem;
  DNS: DNSItem;
};

export interface PingInfo {
  baiduPing: PingItem;
  aliyunPing: PingItem;
  // xtPing: PingItem;
  // codepushPing: PingItem;
};

export interface PingItem {
  host: string;
  time: string;
};

export interface ProxyItem {
  ip: string;
  port: string;
  type?: string;
};

export interface DNSItem {
  host: string;
  ip: string;
};