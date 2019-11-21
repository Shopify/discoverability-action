// rollup.config.js
import babel from 'rollup-plugin-babel';
import typescript from 'rollup-plugin-typescript2';

const rollupConfig = {
  input: 'splash/index.ts',
  output: [
    {
      file: 'index.js',
      format: 'cjs',
    },
    {
      file: 'index.es.js',
      format: 'esm',
    },
  ],
  external: () => true,
  onwarn: (warning, warn) => {
    // Unresolved imports means Rollup couldn't find an import, possibly because
    // we made a typo in the file name. Fail the build in that case so we know
    // when the library is no longer self-contained or we have bad imports
    if (warning.code === 'UNRESOLVED_IMPORT') {
      throw new Error(warning.message);
    }

    // Use default for everything else
    warn(warning);
  },
  plugins: [
    typescript(),
    babel({
      exclude: 'node_modules/**',
      extensions: ['.ts'],
      envName: 'production',
    }),
  ],
};

export default rollupConfig;
