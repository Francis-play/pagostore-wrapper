import React, {createContext, useRef, useEffect} from 'react';
import PersistentWebView, {
  PersistentWebViewRef,
} from '../components/PersistentWebView';
import {purchaseQueue} from '../purchase/purchaseQueue';
import {useWebViewController} from '../webview/useWebViewController';

export const WebViewContext = createContext<{
  webviewRef: React.RefObject<PersistentWebViewRef | null> | null
}>({webviewRef: null});

export function WebViewProvider({children}: any) {
  const webviewRef = useRef<PersistentWebViewRef>(null);

  const {handleMessage} = useWebViewController();

  useEffect(() => {
    if (webviewRef.current) {
      purchaseQueue.attachWebView(webviewRef.current);
    }
  }, []);

  return (
    <WebViewContext.Provider value={{webviewRef}}>
      {children}

      <PersistentWebView ref={webviewRef} onMessage={handleMessage} />
    </WebViewContext.Provider>
  );
}
