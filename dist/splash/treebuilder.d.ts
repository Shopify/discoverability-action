export declare function getGitStagedFiles(scope?: string): Promise<unknown>;
export declare function getDependencies(codebaseGlob: string, ignoreGlob: string, fileGlobs: string[]): {
    fileName: string;
    dependencies: string[];
}[];
