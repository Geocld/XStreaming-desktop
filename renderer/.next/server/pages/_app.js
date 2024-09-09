/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
(() => {
var exports = {};
exports.id = "pages/_app";
exports.ids = ["pages/_app"];
exports.modules = {

/***/ "./pages/_app.tsx":
/*!************************!*\
  !*** ./pages/_app.tsx ***!
  \************************/
/***/ ((module, __webpack_exports__, __webpack_require__) => {

"use strict";
eval("__webpack_require__.a(module, async (__webpack_handle_async_dependencies__, __webpack_async_result__) => { try {\n__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"default\": () => (/* binding */ MyApp)\n/* harmony export */ });\n/* harmony import */ var react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react/jsx-dev-runtime */ \"react/jsx-dev-runtime\");\n/* harmony import */ var react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__);\n/* harmony import */ var _styles_css__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../styles.css */ \"./styles.css\");\n/* harmony import */ var _styles_css__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_styles_css__WEBPACK_IMPORTED_MODULE_1__);\n/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! react */ \"react\");\n/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_2__);\n/* harmony import */ var next_navigation__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! next/navigation */ \"../node_modules/next/navigation.js\");\n/* harmony import */ var next_navigation__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(next_navigation__WEBPACK_IMPORTED_MODULE_3__);\n/* harmony import */ var _nextui_org_react__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! @nextui-org/react */ \"@nextui-org/react\");\n/* harmony import */ var next_themes__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! next-themes */ \"next-themes\");\n/* harmony import */ var next_themes__WEBPACK_IMPORTED_MODULE_5___default = /*#__PURE__*/__webpack_require__.n(next_themes__WEBPACK_IMPORTED_MODULE_5__);\n/* harmony import */ var react_query__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! react-query */ \"react-query\");\n/* harmony import */ var react_query__WEBPACK_IMPORTED_MODULE_6___default = /*#__PURE__*/__webpack_require__.n(react_query__WEBPACK_IMPORTED_MODULE_6__);\nvar __webpack_async_dependencies__ = __webpack_handle_async_dependencies__([_nextui_org_react__WEBPACK_IMPORTED_MODULE_4__]);\n_nextui_org_react__WEBPACK_IMPORTED_MODULE_4__ = (__webpack_async_dependencies__.then ? (await __webpack_async_dependencies__)() : __webpack_async_dependencies__)[0];\n\n\n\n\n\n\n\n// This default export is required in a new `pages/_app.js` file.\nfunction MyApp({ Component, pageProps }) {\n    const router = (0,next_navigation__WEBPACK_IMPORTED_MODULE_3__.useRouter)();\n    const queryClient = new react_query__WEBPACK_IMPORTED_MODULE_6__.QueryClient();\n    const [loggedIn, setLoginState] = react__WEBPACK_IMPORTED_MODULE_2___default().useState(false);\n    const [prevUserState, setPrevUserState] = react__WEBPACK_IMPORTED_MODULE_2___default().useState({\n        signedIn: false,\n        gamertag: \"\",\n        gamerpic: \"\",\n        gamerscore: \"\",\n        level: \"\"\n    });\n    // const [headerLinks, setHeaderLinks] = React.useState([])\n    // const [streamingMode, setStreamingMode] = React.useState(false)\n    // const [isLoading, setIsLoading] = React.useState(false)\n    react__WEBPACK_IMPORTED_MODULE_2___default().useEffect(()=>{\n        const errorHandler = function(event) {\n            console.error(\"Unhandled rejection (promise: \", event.promise, \", reason: \", event.reason, \").\");\n            if (event.reason.status) {\n                alert(\"HTTP Status: \" + event.reason.status + \"\\nPath:\" + event.reason.url + \"\\n\" + event.reason.body);\n            } else {\n                alert(event.reason);\n            }\n        };\n        window.addEventListener(\"unhandledrejection\", errorHandler);\n        // cleanup this component\n        return ()=>{\n            window.removeEventListener(\"unhandledrejection\", errorHandler);\n        // if(authInterval)\n        //     clearInterval(authInterval)\n        };\n    }, []);\n    return /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(_nextui_org_react__WEBPACK_IMPORTED_MODULE_4__.NextUIProvider, {\n        children: /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(next_themes__WEBPACK_IMPORTED_MODULE_5__.ThemeProvider, {\n            attribute: \"class\",\n            defaultTheme: \"xbox\",\n            children: /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(Component, {\n                ...pageProps\n            }, void 0, false, {\n                fileName: \"/Users/lijiahao/Desktop/lijiahao/my-git/XStreaming-desktop/renderer/pages/_app.tsx\",\n                lineNumber: 68,\n                columnNumber: 9\n            }, this)\n        }, void 0, false, {\n            fileName: \"/Users/lijiahao/Desktop/lijiahao/my-git/XStreaming-desktop/renderer/pages/_app.tsx\",\n            lineNumber: 67,\n            columnNumber: 7\n        }, this)\n    }, void 0, false, {\n        fileName: \"/Users/lijiahao/Desktop/lijiahao/my-git/XStreaming-desktop/renderer/pages/_app.tsx\",\n        lineNumber: 66,\n        columnNumber: 5\n    }, this);\n}\n\n__webpack_async_result__();\n} catch(e) { __webpack_async_result__(e); } });//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiLi9wYWdlcy9fYXBwLnRzeCIsIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBdUI7QUFFRztBQUdrQjtBQUNPO0FBQ2U7QUFJSDtBQUUvRCxpRUFBaUU7QUFDbEQsU0FBU00sTUFBTSxFQUFFQyxTQUFTLEVBQUVDLFNBQVMsRUFBRTtJQUNwRCxNQUFNQyxTQUFTUiwwREFBU0E7SUFDeEIsTUFBTVMsY0FBYyxJQUFJTCxvREFBV0E7SUFFbkMsTUFBTSxDQUFDTSxVQUFVQyxjQUFjLEdBQUdaLHFEQUFjLENBQUM7SUFDakQsTUFBTSxDQUFDYyxlQUFlQyxpQkFBaUIsR0FBR2YscURBQWMsQ0FBQztRQUN2RGdCLFVBQVU7UUFDVkMsVUFBVTtRQUNWQyxVQUFVO1FBQ1ZDLFlBQVk7UUFDWkMsT0FBTztJQUNUO0lBQ0EsMkRBQTJEO0lBQzNELGtFQUFrRTtJQUNsRSwwREFBMEQ7SUFFMURwQixzREFBZSxDQUFDO1FBRWQsTUFBTXNCLGVBQWUsU0FBVUMsS0FBSztZQUNsQ0MsUUFBUUMsS0FBSyxDQUNYLGtDQUNBRixNQUFNRyxPQUFPLEVBQ2IsY0FDQUgsTUFBTUksTUFBTSxFQUNaO1lBRUYsSUFBSUosTUFBTUksTUFBTSxDQUFDQyxNQUFNLEVBQUU7Z0JBQ3ZCQyxNQUNFLGtCQUNFTixNQUFNSSxNQUFNLENBQUNDLE1BQU0sR0FDbkIsWUFDQUwsTUFBTUksTUFBTSxDQUFDRyxHQUFHLEdBQ2hCLE9BQ0FQLE1BQU1JLE1BQU0sQ0FBQ0ksSUFBSTtZQUV2QixPQUFPO2dCQUNMRixNQUFNTixNQUFNSSxNQUFNO1lBQ3BCO1FBQ0Y7UUFDQUssT0FBT0MsZ0JBQWdCLENBQUMsc0JBQXNCWDtRQUU5Qyx5QkFBeUI7UUFDekIsT0FBTztZQUNMVSxPQUFPRSxtQkFBbUIsQ0FBQyxzQkFBc0JaO1FBRWpELG1CQUFtQjtRQUNuQixrQ0FBa0M7UUFDcEM7SUFDRixHQUFHLEVBQUU7SUFFTCxxQkFDRSw4REFBQ3BCLDZEQUFjQTtrQkFDYiw0RUFBQ0Usc0RBQWtCQTtZQUFDK0IsV0FBVTtZQUFRQyxjQUFhO3NCQUNqRCw0RUFBQzdCO2dCQUFXLEdBQUdDLFNBQVM7Ozs7Ozs7Ozs7Ozs7Ozs7QUFJaEMiLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vLi9wYWdlcy9fYXBwLnRzeD8yZmJlIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBcIi4uL3N0eWxlcy5jc3NcIjtcblxuaW1wb3J0IFJlYWN0IGZyb20gXCJyZWFjdFwiO1xuaW1wb3J0IEhlYWQgZnJvbSBcIm5leHQvaGVhZFwiO1xuaW1wb3J0IElwYyBmcm9tIFwiLi4vbGliL2lwY1wiO1xuaW1wb3J0IHsgdXNlUm91dGVyIH0gZnJvbSBcIm5leHQvbmF2aWdhdGlvblwiO1xuaW1wb3J0IHsgTmV4dFVJUHJvdmlkZXIgfSBmcm9tIFwiQG5leHR1aS1vcmcvcmVhY3RcIjtcbmltcG9ydCB7IFRoZW1lUHJvdmlkZXIgYXMgTmV4dFRoZW1lc1Byb3ZpZGVyIH0gZnJvbSBcIm5leHQtdGhlbWVzXCI7XG5cbmltcG9ydCB7IFVzZXJQcm92aWRlciB9IGZyb20gXCIuLi9jb250ZXh0L3VzZXJDb250ZXh0XCI7XG5cbmltcG9ydCB7IFF1ZXJ5Q2xpZW50LCBRdWVyeUNsaWVudFByb3ZpZGVyIH0gZnJvbSBcInJlYWN0LXF1ZXJ5XCI7XG5cbi8vIFRoaXMgZGVmYXVsdCBleHBvcnQgaXMgcmVxdWlyZWQgaW4gYSBuZXcgYHBhZ2VzL19hcHAuanNgIGZpbGUuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBNeUFwcCh7IENvbXBvbmVudCwgcGFnZVByb3BzIH0pIHtcbiAgY29uc3Qgcm91dGVyID0gdXNlUm91dGVyKCk7XG4gIGNvbnN0IHF1ZXJ5Q2xpZW50ID0gbmV3IFF1ZXJ5Q2xpZW50KCk7XG5cbiAgY29uc3QgW2xvZ2dlZEluLCBzZXRMb2dpblN0YXRlXSA9IFJlYWN0LnVzZVN0YXRlKGZhbHNlKTtcbiAgY29uc3QgW3ByZXZVc2VyU3RhdGUsIHNldFByZXZVc2VyU3RhdGVdID0gUmVhY3QudXNlU3RhdGUoe1xuICAgIHNpZ25lZEluOiBmYWxzZSxcbiAgICBnYW1lcnRhZzogXCJcIixcbiAgICBnYW1lcnBpYzogXCJcIixcbiAgICBnYW1lcnNjb3JlOiBcIlwiLFxuICAgIGxldmVsOiBcIlwiLFxuICB9KTtcbiAgLy8gY29uc3QgW2hlYWRlckxpbmtzLCBzZXRIZWFkZXJMaW5rc10gPSBSZWFjdC51c2VTdGF0ZShbXSlcbiAgLy8gY29uc3QgW3N0cmVhbWluZ01vZGUsIHNldFN0cmVhbWluZ01vZGVdID0gUmVhY3QudXNlU3RhdGUoZmFsc2UpXG4gIC8vIGNvbnN0IFtpc0xvYWRpbmcsIHNldElzTG9hZGluZ10gPSBSZWFjdC51c2VTdGF0ZShmYWxzZSlcblxuICBSZWFjdC51c2VFZmZlY3QoKCkgPT4ge1xuICAgIFxuICAgIGNvbnN0IGVycm9ySGFuZGxlciA9IGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgY29uc29sZS5lcnJvcihcbiAgICAgICAgXCJVbmhhbmRsZWQgcmVqZWN0aW9uIChwcm9taXNlOiBcIixcbiAgICAgICAgZXZlbnQucHJvbWlzZSxcbiAgICAgICAgXCIsIHJlYXNvbjogXCIsXG4gICAgICAgIGV2ZW50LnJlYXNvbixcbiAgICAgICAgXCIpLlwiXG4gICAgICApO1xuICAgICAgaWYgKGV2ZW50LnJlYXNvbi5zdGF0dXMpIHtcbiAgICAgICAgYWxlcnQoXG4gICAgICAgICAgXCJIVFRQIFN0YXR1czogXCIgK1xuICAgICAgICAgICAgZXZlbnQucmVhc29uLnN0YXR1cyArXG4gICAgICAgICAgICBcIlxcblBhdGg6XCIgK1xuICAgICAgICAgICAgZXZlbnQucmVhc29uLnVybCArXG4gICAgICAgICAgICBcIlxcblwiICtcbiAgICAgICAgICAgIGV2ZW50LnJlYXNvbi5ib2R5XG4gICAgICAgICk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBhbGVydChldmVudC5yZWFzb24pO1xuICAgICAgfVxuICAgIH07XG4gICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoXCJ1bmhhbmRsZWRyZWplY3Rpb25cIiwgZXJyb3JIYW5kbGVyKTtcblxuICAgIC8vIGNsZWFudXAgdGhpcyBjb21wb25lbnRcbiAgICByZXR1cm4gKCkgPT4ge1xuICAgICAgd2luZG93LnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJ1bmhhbmRsZWRyZWplY3Rpb25cIiwgZXJyb3JIYW5kbGVyKTtcblxuICAgICAgLy8gaWYoYXV0aEludGVydmFsKVxuICAgICAgLy8gICAgIGNsZWFySW50ZXJ2YWwoYXV0aEludGVydmFsKVxuICAgIH07XG4gIH0sIFtdKTtcblxuICByZXR1cm4gKFxuICAgIDxOZXh0VUlQcm92aWRlcj5cbiAgICAgIDxOZXh0VGhlbWVzUHJvdmlkZXIgYXR0cmlidXRlPVwiY2xhc3NcIiBkZWZhdWx0VGhlbWU9XCJ4Ym94XCI+XG4gICAgICAgIDxDb21wb25lbnQgey4uLnBhZ2VQcm9wc30gLz5cbiAgICAgIDwvTmV4dFRoZW1lc1Byb3ZpZGVyPlxuICAgIDwvTmV4dFVJUHJvdmlkZXI+XG4gICk7XG59XG4iXSwibmFtZXMiOlsiUmVhY3QiLCJ1c2VSb3V0ZXIiLCJOZXh0VUlQcm92aWRlciIsIlRoZW1lUHJvdmlkZXIiLCJOZXh0VGhlbWVzUHJvdmlkZXIiLCJRdWVyeUNsaWVudCIsIk15QXBwIiwiQ29tcG9uZW50IiwicGFnZVByb3BzIiwicm91dGVyIiwicXVlcnlDbGllbnQiLCJsb2dnZWRJbiIsInNldExvZ2luU3RhdGUiLCJ1c2VTdGF0ZSIsInByZXZVc2VyU3RhdGUiLCJzZXRQcmV2VXNlclN0YXRlIiwic2lnbmVkSW4iLCJnYW1lcnRhZyIsImdhbWVycGljIiwiZ2FtZXJzY29yZSIsImxldmVsIiwidXNlRWZmZWN0IiwiZXJyb3JIYW5kbGVyIiwiZXZlbnQiLCJjb25zb2xlIiwiZXJyb3IiLCJwcm9taXNlIiwicmVhc29uIiwic3RhdHVzIiwiYWxlcnQiLCJ1cmwiLCJib2R5Iiwid2luZG93IiwiYWRkRXZlbnRMaXN0ZW5lciIsInJlbW92ZUV2ZW50TGlzdGVuZXIiLCJhdHRyaWJ1dGUiLCJkZWZhdWx0VGhlbWUiXSwic291cmNlUm9vdCI6IiJ9\n//# sourceURL=webpack-internal:///./pages/_app.tsx\n");

/***/ }),

/***/ "./styles.css":
/*!********************!*\
  !*** ./styles.css ***!
  \********************/
/***/ (() => {



/***/ }),

/***/ "next-themes":
/*!******************************!*\
  !*** external "next-themes" ***!
  \******************************/
/***/ ((module) => {

"use strict";
module.exports = require("next-themes");

/***/ }),

/***/ "./request-async-storage.external":
/*!********************************************************************************!*\
  !*** external "next/dist/client/components/request-async-storage.external.js" ***!
  \********************************************************************************/
/***/ ((module) => {

"use strict";
module.exports = require("next/dist/client/components/request-async-storage.external.js");

/***/ }),

/***/ "./static-generation-async-storage.external":
/*!******************************************************************************************!*\
  !*** external "next/dist/client/components/static-generation-async-storage.external.js" ***!
  \******************************************************************************************/
/***/ ((module) => {

"use strict";
module.exports = require("next/dist/client/components/static-generation-async-storage.external.js");

/***/ }),

/***/ "next/dist/compiled/next-server/pages.runtime.dev.js":
/*!**********************************************************************!*\
  !*** external "next/dist/compiled/next-server/pages.runtime.dev.js" ***!
  \**********************************************************************/
/***/ ((module) => {

"use strict";
module.exports = require("next/dist/compiled/next-server/pages.runtime.dev.js");

/***/ }),

/***/ "react":
/*!************************!*\
  !*** external "react" ***!
  \************************/
/***/ ((module) => {

"use strict";
module.exports = require("react");

/***/ }),

/***/ "react-query":
/*!******************************!*\
  !*** external "react-query" ***!
  \******************************/
/***/ ((module) => {

"use strict";
module.exports = require("react-query");

/***/ }),

/***/ "react/jsx-dev-runtime":
/*!****************************************!*\
  !*** external "react/jsx-dev-runtime" ***!
  \****************************************/
/***/ ((module) => {

"use strict";
module.exports = require("react/jsx-dev-runtime");

/***/ }),

/***/ "@nextui-org/react":
/*!************************************!*\
  !*** external "@nextui-org/react" ***!
  \************************************/
/***/ ((module) => {

"use strict";
module.exports = import("@nextui-org/react");;

/***/ })

};
;

// load runtime
var __webpack_require__ = require("../webpack-runtime.js");
__webpack_require__.C(exports);
var __webpack_exec__ = (moduleId) => (__webpack_require__(__webpack_require__.s = moduleId))
var __webpack_exports__ = __webpack_require__.X(0, ["vendor-chunks/next"], () => (__webpack_exec__("./pages/_app.tsx")));
module.exports = __webpack_exports__;

})();