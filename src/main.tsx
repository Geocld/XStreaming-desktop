import React from 'react'
import ReactDOM from 'react-dom/client'
import {
  createHashRouter,
  RouterProvider,
} from "react-router-dom";
import { NextUIProvider } from "@nextui-org/react"
import { ThemeProvider as NextThemesProvider } from "next-themes";
import 'webrtc-adapter';
import Home from './pages/home/Home.tsx'
import './i18n'

import './index.css'

const router = createHashRouter([
  {
    path: '/',
    element: <Home/>,
  },
]);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <NextUIProvider>
      <NextThemesProvider attribute="class" defaultTheme="xbox">
        <RouterProvider router={router} />
      </NextThemesProvider>
    </NextUIProvider>
  </React.StrictMode>,
)
