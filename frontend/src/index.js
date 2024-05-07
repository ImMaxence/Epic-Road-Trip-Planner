import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./style/index.scss";
import { ConfigProvider, theme } from "antd";
import { GoogleOAuthProvider } from "@react-oauth/google";
//import frFR from 'antd/es/locale/fr_FR';
import frFR from "antd/locale/fr_FR";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <GoogleOAuthProvider clientId="782240240187-vqf92o0sf08ci755v469v77a17i0kg4m.apps.googleusercontent.com">
    <ConfigProvider
      locale={frFR}
      theme={{
        token: {
          colorPrimary: "#fadb14",
          colorInfo: "#fadb14",
        },
        components: {
          Layout: {
            headerBg: "rgb(255,255,255)",
          },
          Menu: {
            lineWidth: 0,
          },
        },
      }}
    >
      <React.StrictMode>
        <App />
      </React.StrictMode>
    </ConfigProvider>
  </GoogleOAuthProvider>
);
