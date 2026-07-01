import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.csinterview.helper',
  appName: 'CS面试助手',
  webDir: 'dist',
  ios: {
    contentInset: 'always',
    scheme: 'CSInterviewHelper',
    preferredContentMode: 'mobile',
  },
};

export default config;
