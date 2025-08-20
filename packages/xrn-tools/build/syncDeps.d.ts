/**
 * 同步工作区中所有包对某个依赖的版本
 *
 * @param targetDepName 目标依赖的名称
 */
export declare const syncDependencyVersionAcrossWorkspaces: (targetDepName: string) => Promise<void>;
/**
 * 同步工作区中所有包的依赖版本
 * 如果依赖项在工作区中存在，则更新为工作区中的版本
 */
export declare const syncAllDependenciesAcrossWorkspaces: () => Promise<void>;
