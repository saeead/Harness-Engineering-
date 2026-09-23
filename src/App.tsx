/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AppProviders } from './state';
import { AppLayout } from './components/layout/AppLayout';
import { FoundationWorkspace } from './components/foundation/FoundationWorkspace';

export default function App() {
  return (
    <AppProviders>
      <AppLayout>
        <FoundationWorkspace />
      </AppLayout>
    </AppProviders>
  );
}

