import { useCallback, DragEvent, useEffect } from 'react';
import shortid from 'shortid';
import {
  DashboardPluginComponentProps,
  LayoutUtils,
  PanelEvent,
  useListener,
} from '@deephaven/dashboard';
import type { VariableDefinition } from '@deephaven/jsapi-types';
import Log from '@deephaven/log';
import ComponentPanel from './ComponentPanel';

const log = Log.module('@deephaven/js-plugin-ui/DashboardPlugin');

const NAME_COMPONENT_NODE = 'deephaven.ui.component.ComponentNode';

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
      log.info('widget type is', type);
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
      } else if (type === NAME_COMPONENT_NODE) {
        const config = {
          type: 'react-component' as const,
          component: NAME_COMPONENT_NODE,
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
      const cleanups = [registerComponent(NAME_COMPONENT_NODE, ComponentPanel)];
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
