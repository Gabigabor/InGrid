import React from 'react';
import type { Preview } from '@storybook/react';
import { withTokenInspector } from './token-inspector/decorator';
import '../packages/tokens/dist/tokens.css';
import '../packages/tokens/dist/text-styles.css';

const preview: Preview = {
  globalTypes: {
    theme: {
      description: 'Ingrid colour mode (Figma Colors collection)',
      toolbar: { icon: 'mirror', items: ['light', 'dark'], dynamicTitle: true },
    },
  },
  initialGlobals: { theme: 'light' },
  decorators: [
    // Feeds the Tokens tab on stories that set parameters.tokenInspector (inside the theme wrapper).
    withTokenInspector,
    (Story, { globals }) => (
      <div
        data-theme={globals.theme}
        style={{ background: 'var(--ingrid-color-surface-default)', padding: 24, minHeight: '100%' }}
      >
        <Story />
      </div>
    ),
  ],
};
export default preview;
