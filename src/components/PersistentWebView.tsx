import React, {forwardRef, useImperativeHandle, useRef} from 'react';
import {Platform} from 'react-native';
import {WebView} from 'react-native-webview';
import {paymentController} from '../core/paymentController';
import injected from '../webview/injected'; // if exists

const PersistentWebView = forwardRef((props, ref) => {
  const wref = useRef(null);

  useImperativeHandle(ref, () => ({
    injectJavaScript: (js) => {
      try {
        if (wref.current && wref.current.injectJavaScript) {
          wref.current.injectJavaScript(js);
        }
      } catch(e){}
    },
    getRef: () => wref.current
  }));

  return (
    <WebView
      ref={wref}
      source={{ uri: 'https://pagostore.garena.com' }}
      style={{width:0, height:0}}
      onMessage={(e) => paymentController.onWebViewMessage(e)}
      sharedCookiesEnabled={true}
      thirdPartyCookiesEnabled={true}
      javaScriptEnabled={true}
      domStorageEnabled={true}
      originWhitelist={['*']}
      injectedJavaScript={typeof injected === 'string' ? injected : undefined}
    />
  );
});

export default PersistentWebView;
