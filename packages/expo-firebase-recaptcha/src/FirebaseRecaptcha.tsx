import { DEFAULT_WEB_APP_OPTIONS, IFirebaseOptions } from 'expo-firebase-core';
import * as React from 'react';
import { WebView } from 'react-native-webview';

interface Props extends React.ComponentProps<typeof WebView> {
  firebaseConfig?: IFirebaseOptions;
  firebaseVersion?: string;
  onLoad?: () => any;
  onError?: () => any;
  onVerify: (token: string) => any;
}

function getWebviewSource(firebaseConfig: IFirebaseOptions, firebaseVersion?: string) {
  firebaseVersion = firebaseVersion || '7.12.0';
  return {
    baseUrl: `https://${firebaseConfig.authDomain}`,
    html: `
<!DOCTYPE html><html>
<head>
  <meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
  <meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1">
  <meta name="HandheldFriendly" content="true">
  <script src="https://www.gstatic.com/firebasejs/${firebaseVersion}/firebase-app.js"></script>
  <script src="https://www.gstatic.com/firebasejs/${firebaseVersion}/firebase-auth.js"></script>
  <script type="text/javascript">firebase.initializeApp(${JSON.stringify(firebaseConfig)});</script>
</head>
<body>
  <div id="recaptcha-cont" class="g-recaptcha"></div>
  <script>
    function onLoad() {
      document.getElementById("loading").innerHTML = "onLoad called";
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'load'
      }));
      window.recaptchaVerifier = new firebase.auth.RecaptchaVerifier("recaptcha-cont", {
        size: "normal",
        callback: function(response) {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'verify',
            token: response
          }));
        }
      });
      window.recaptchaVerifier.render();
    }
    function onError() {
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'error'
      }));
    }
  </script>
  <script src="https://www.google.com/recaptcha/api.js?onload=onLoad&render=explicit" onerror="onError()"></script>
</body></html>`,
  };
}

export default function FirebaseRecaptcha(props: Props) {
  const { firebaseConfig, firebaseVersion, onVerify, onLoad, onError, ...otherProps } = props;
  if (!firebaseConfig) {
    console.error(
      `FirebaseRecaptcha: Missing firebase web configuration. Please set the "expo.web.config.firebase" field in "app.json" or use the "firebaseConfig" prop.`
    );
    return null;
  }
  return (
    <WebView
      javaScriptEnabled
      automaticallyAdjustContentInsets
      scalesPageToFit
      mixedContentMode="always"
      source={getWebviewSource(firebaseConfig, firebaseVersion)}
      onError={onError}
      onMessage={event => {
        const data = JSON.parse(event.nativeEvent.data);
        switch (data.type) {
          case 'load':
            if (onLoad) {
              onLoad();
            }
            break;
          case 'error':
            if (onError) {
              onError();
            }
            break;
          case 'verify':
            onVerify(data.token);
            break;
        }
      }}
      {...otherProps}
    />
  );
}

FirebaseRecaptcha.defaultProps = {
  firebaseConfig: DEFAULT_WEB_APP_OPTIONS,
};
