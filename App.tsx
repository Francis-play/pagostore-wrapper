import React from 'react'
import { StatusBar } from 'react-native'
import { WebViewProvider } from './src/context/WebViewContext'
import RootNavigator from './src/navigation/RootNavigator'

export default function App() {
  return (
    <WebViewProvider>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <RootNavigator />
    </WebViewProvider>
  )
}