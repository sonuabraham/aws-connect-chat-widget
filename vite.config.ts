import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const isLibrary = mode === 'library';

  if (isLibrary) {
    // Library build configuration for embeddable widget
    return {
      plugins: [react()],
      build: {
        lib: {
          entry: resolve(__dirname, 'src/widget-simple.tsx'),
          name: 'AWSConnectChatWidget',
          fileName: (format) => `aws-connect-chat-widget.${format}.js`,
          formats: ['umd', 'es'],
        },
        rollupOptions: {
          external: ['react', 'react-dom'],
          output: {
            globals: {
              react: 'React',
              'react-dom': 'ReactDOM',
            },
            assetFileNames: 'aws-connect-chat-widget.[ext]',
          },
        },
        minify: 'terser',
        sourcemap: true,
      },
      define: {
        'process.env.NODE_ENV': JSON.stringify('production'),
      },
      esbuild: {
        // Skip TypeScript type checking for library build
        target: 'es2015',
      },
    };
  }

  // Regular app build configuration
  return {
    plugins: [react()],
    build: {
      sourcemap: true,
    },
  };
});
