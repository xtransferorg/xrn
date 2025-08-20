interface PublishOptions {
    packageName: string;
    isBeta?: boolean;
}
export declare function publishPackage({ packageName, isBeta, }: PublishOptions): Promise<void>;
export {};
