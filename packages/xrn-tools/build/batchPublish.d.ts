interface BatchPublishOptions {
    beta?: boolean;
    packages: string[];
}
export declare function batchPublish({ beta, packages, }: BatchPublishOptions): Promise<void>;
export {};
