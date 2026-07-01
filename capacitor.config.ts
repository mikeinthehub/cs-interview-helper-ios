import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.csinterview.helper',
  appName: 'CS面试助手',
  webDir: 'backend/static',
  bundledWebRuntime: false,
  server: {
    // For development: use your PC's IP
    // For production: remove this to use bundled web assets
    // url: 'http://192.168.x.x:8000',
    // cleartext: true,
  },
  ios: {
    contentInset: 'always',
    scheme: 'CSInterviewHelper',
    // iPhone 14 Pro Max specific
    preferredContentMode: 'mobile',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 500,
      backgroundColor: '#F2F2F7',
    },
  },
};

export default config;
