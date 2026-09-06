/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { RouterProvider } from "react-router-dom";
import { AuthProvider } from "./lib/auth/AuthProvider";
import { router } from "./app/router";
import { AppErrorBoundary } from "./components/layout/AppErrorBoundary";

export default function App() {
  return (
    <AppErrorBoundary>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </AppErrorBoundary>
  );
}


