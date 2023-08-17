import { useCallback, DragEvent, useEffect } from 'react';
import shortid from 'shortid';
import {
  DashboardPluginComponentProps,
  LayoutUtils,
  PanelEvent,
  useListener,
} from '@deephaven/dashboard';
import type { VariableDefinition } from '@deephaven/jsapi-types';
import UiPanel, { type LayoutWidget } from './UiPanel';
import TextInputPanel from './TextInputPanel';

export function DashboardPlugin(
  props: DashboardPluginComponentProps
): JSX.Element | null {
  const { id, layout, registerComponent } = props;

  const handlePanelOpen = useCallback(
    async ({
      dragEvent,
      fetch,
      metadata = {},
      panelId = shortid.generate(),
      widget,
    }: {
      dragEvent?: DragEvent;
      fetch: () => Promise<unknown>;
      metadata?: Record<string, unknown>;
      panelId?: string;
      widget: VariableDefinition;
    }) => {
      const { type, title } = widget;
      if (type === 'deephaven.ui.Panel') {
        const config = {
          type: 'react-component' as const,
          component: 'UiPanel',
          props: {
            localDashboardId: id,
            id: panelId,
            metadata: {
              ...metadata,
              name: title,
              figure: title,
              type,
            },
            fetch,
          },
          title,
          id: panelId,
        };

        const { root } = layout;
        LayoutUtils.openComponent({ root, config, dragEvent });
      } else if (type === 'deephaven.ui.TextInput') {
        const config = {
          type: 'react-component' as const,
          component: 'TextInputPanel',
          props: {
            localDashboardId: id,
            id: panelId,
            metadata: {
              ...metadata,
              name: title,
              figure: title,
              type,
            },
            fetch,
          },
          title,
          id: panelId,
        };

        const { root } = layout;
        LayoutUtils.openComponent({ root, config, dragEvent });
      }
    },
    [id, layout]
  );

  useEffect(
    function registerComponentsAndReturnCleanup() {
      const cleanups = [
        registerComponent('UiPanel', UiPanel),
        registerComponent('TextInputPanel', TextInputPanel),
      ];
      return () => {
        cleanups.forEach(cleanup => cleanup());
      };
    },
    [registerComponent]
  );

  useListener(layout.eventHub, PanelEvent.OPEN, handlePanelOpen);

  return null;
}

export default DashboardPlugin;
