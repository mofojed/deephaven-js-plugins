import React, { useCallback, useEffect } from 'react';
import shortid from 'shortid';
import {
  DashboardPluginComponentProps,
  LayoutUtils,
  PanelEvent,
  useListener,
} from '@deephaven/dashboard';
import { GoldenLayout } from '@deephaven/golden-layout';
import { VariableDefinition } from '@deephaven/jsapi-shim';
import Log from '@deephaven/log';
import InputPanel, { JsWidgetInput } from './InputPanel';

const log = Log.module('@deephaven/js-plugin-module-template.DashboardPlugin');

export const INTERACTIVE_QUERY_OBJECT_TYPE =
  'deephaven.plugin.interactive.InteractiveQuery';

export function openOutputPanel({
  panelId = shortid.generate(),
  fetch,
  widget,
  layout,
}) {
  log.info('openOutputPanel', panelId, widget);

  const openOptions = { fetch, widget, panelId };
  layout.eventHub.emit(PanelEvent.OPEN, openOptions);
}

export function openInputPanel({
  dragEvent,
  fetch,
  layout,
  localDashboardId = '',
  panelId = shortid.generate(),
  widget,
}: {
  dragEvent?: DragEvent;
  fetch: () => Promise<unknown>;
  layout: GoldenLayout;
  localDashboardId?: string;
  panelId?: string;
  widget: VariableDefinition;
}) {
  const { id: widgetId, name, type } = widget;

  // We actually need to open multiple panels for interactive queries. But let's start with the inputs panel
  const metadata = { id: widgetId, name, type };
  const config = {
    type: 'react-component',
    component: InputPanel.COMPONENT,
    props: {
      localDashboardId,
      id: panelId,
      metadata,
      fetch,
    },
    title: name,
    id: panelId,
  };

  const { root } = layout;
  LayoutUtils.openComponent({ root, config, dragEvent });
}

export const DashboardPlugin = ({
  id,
  layout,
  registerComponent,
}: DashboardPluginComponentProps): JSX.Element => {
  const handlePanelOpen = useCallback(
    (props: {
      dragEvent?: DragEvent;
      fetch: () => Promise<unknown>;
      panelId?: string;
      widget: VariableDefinition;
    }) => {
      const { id: widgetId, name, type } = props.widget;
      // Only want to open panels for the interactive query object
      if ((type as string) == INTERACTIVE_QUERY_OBJECT_TYPE) {
        log.info('Panel opened of type', type);
        openInputPanel({ ...props, layout, localDashboardId: id });
        return;
      }
    },
    [id, layout]
  );

  useEffect(() => {
    const cleanups = [registerComponent(InputPanel.COMPONENT, InputPanel)];

    return () => {
      cleanups.forEach(cleanup => cleanup());
    };
  }, [registerComponent]);

  useListener(layout.eventHub, 'PanelEvent.OPEN', handlePanelOpen);

  return <></>;
};

export default DashboardPlugin;
