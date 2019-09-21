export declare type Dependencies = {
    fileName: string;
    dependencies: string[];
}[];
export declare function getGitStagedFiles(scope?: string): Promise<unknown>;
export declare function getDependencies(codebaseGlob: string, ignoreGlob: string, fileGlobs: string[]): Promise<Dependencies>;
