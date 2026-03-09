import React, {forwardRef, useImperativeHandle, useRef} from 'react';
import {Platform} from 'react-native';
import WebView, {WebViewMessageEvent} from 'react-native-webview';
import {paymentController} from '../core/paymentController';

type Props = {
  onMessage?: (event: WebViewMessageEvent) => void;
};

export type PersistentWebViewRef = {
  injectJavaScript: (js: string) => void;
  getRef: () => WebView | null;
};

const PersistentWebView = forwardRef<PersistentWebViewRef, Props>(
  (props, ref) => {
    const wref = useRef<WebView>(null);

    useImperativeHandle(ref, () => ({
      injectJavaScript: (js: string) => {
        try {
          if (wref.current && wref.current.injectJavaScript) {
            wref.current.injectJavaScript(js);
          }
        } catch (e) {}
      },
      getRef: () => wref.current,
    }));

    const onMessage = (event: WebViewMessageEvent) => {
      paymentController.onWebViewMessage(event);
      if (props.onMessage) {
        props.onMessage(event);
      }
    };

    return (
      <WebView
        ref={wref}
        source={{uri: 'https://pagostore.garena.com'}}
        style={{width: 0, height: 0}}
        onMessage={onMessage}
        sharedCookiesEnabled={true}
        thirdPartyCookiesEnabled={true}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        originWhitelist={['*']}
      />
    );
  },
);

export default PersistentWebView;
