export interface NavSDK {
    name: string;
    directory: string;
    expanded?: boolean;
}
export interface DocNavigation {
    sdk: NavSDK[];
}
