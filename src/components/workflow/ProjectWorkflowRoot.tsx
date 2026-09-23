/**
 * Project Workflow Root Component
 * Coordinates the 8-step guided Harness Engineering Wizard:
 * 1. Introduction -> 2. Requirements -> 3. AI Analysis -> 4. Harness Config ->
 * 5. Plan Review -> 6. Generate Structure -> 7. Validate Result -> 8. Export / GitHub
 */

import React from 'react';
import { WizardContainer } from './WizardContainer';

export const ProjectWorkflowRoot: React.FC = () => {
  return <WizardContainer />;
};
