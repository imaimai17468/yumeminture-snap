import type { StorybookConfig } from '@storybook/nextjs';

const config: StorybookConfig = {
  "stories": [
    "../src/**/*.mdx",
    "../src/**/*.stories.@(js|jsx|mjs|ts|tsx)"
  ],
  "addons": [],
  "framework": {
    "name": "@storybook/nextjs",
    "options": {}
  },
  "staticDirs": [
    "../public"
  ],
  webpackFinal: async (config) => {
    // Node.jsモジュールのポリフィルを無効化
    config.resolve = {
      ...config.resolve,
      fallback: {
        ...config.resolve?.fallback,
        net: false,
        tls: false,
        perf_hooks: false,
        fs: false,
        path: false,
        crypto: false,
      },
    };
    return config;
  },
};
export default config;