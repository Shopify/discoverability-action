export declare function getGitStagedFiles(scope?: string): Promise<unknown>;
export declare function getDependencies(codebaseGlob: string, ignoreGlob: string, fileGlobs: string[]): Promise<{
    fileName: string;
    dependencies: string[];
}[]>;
