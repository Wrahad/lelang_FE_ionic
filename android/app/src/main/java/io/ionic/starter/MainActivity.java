package io.ionic.starter;
import com.getcapacitor.BridgeActivity;

// public class MainActivity extends BridgeActivity {}

import ee.forgr.capacitor.social.login.GoogleProvider;
import ee.forgr.capacitor.social.login.SocialLoginPlugin;
import ee.forgr.capacitor.social.login.ModifiedMainActivityForSocialLoginPlugin;
import com.getcapacitor.PluginHandle;
import com.getcapacitor.Plugin;
import android.content.Intent;
import android.util.Log;
import android.os.Bundle;
import android.os.Build;
import android.webkit.WebView;
import android.webkit.WebChromeClient;
import android.webkit.ConsoleMessage;

// ModifiedMainActivityForSocialLoginPlugin is VERY VERY important !!!!!!
public class MainActivity extends BridgeActivity implements ModifiedMainActivityForSocialLoginPlugin {

      private static final String TAG = "IonicTTI";
      private boolean fullyDrawnReported = false;
      private long appStartTime = 0;

      @Override
      public void onCreate(Bundle savedInstanceState) {
        // Catat waktu PALING AWAL sebelum apapun
        appStartTime = System.currentTimeMillis();
        
        super.onCreate(savedInstanceState);
        
        // Enable WebView debugging
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT) {
          WebView.setWebContentsDebuggingEnabled(true);
        }
        
        Log.i(TAG, "BENCHMARK_APP_START:" + appStartTime);
      }

      @Override
      public void onResume() {
        super.onResume();
        
        // Setup WebChromeClient untuk capture console.log
        getBridge().getWebView().setWebChromeClient(new WebChromeClient() {
          @Override
          public boolean onConsoleMessage(ConsoleMessage consoleMessage) {
            String message = consoleMessage.message();
            
            // Log semua console message ke logcat dengan tag khusus
            Log.d(TAG, "JS: " + message);
            
            // Detect TTI marker dari JavaScript
            if (message != null && message.contains("BENCHMARK_TTI_DONE")) {
              long endTime = System.currentTimeMillis();
              long tti = endTime - appStartTime;
              
              Log.i(TAG, "BENCHMARK_TTI_DONE:" + endTime);
              Log.i(TAG, "BENCHMARK_TTI_DURATION:" + tti);
              
              // Panggil reportFullyDrawn untuk metrics resmi Android
              if (!fullyDrawnReported) {
                fullyDrawnReported = true;
                reportFullyDrawn();
                Log.i(TAG, "reportFullyDrawn() called - TTI: " + tti + "ms");
              }
            }
            
            return super.onConsoleMessage(consoleMessage);
          }
        });
      }

      @Override
      public void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);

        if (requestCode >= GoogleProvider.REQUEST_AUTHORIZE_GOOGLE_MIN && requestCode < GoogleProvider.REQUEST_AUTHORIZE_GOOGLE_MAX) {
          PluginHandle pluginHandle = getBridge().getPlugin("SocialLogin");
          if (pluginHandle == null) {
            Log.i("Google Activity Result", "SocialLogin login handle is null");
            return;
          }
          Plugin plugin = pluginHandle.getInstance();
          if (!(plugin instanceof SocialLoginPlugin)) {
            Log.i("Google Activity Result", "SocialLogin plugin instance is not SocialLoginPlugin");
            return;
          }
          ((SocialLoginPlugin) plugin).handleGoogleLoginIntent(requestCode, data);
        }
      }

      // This function will never be called, leave it empty
      @Override
      public void IHaveModifiedTheMainActivityForTheUseWithSocialLoginPlugin() {}
}