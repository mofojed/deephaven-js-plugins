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
import TreeMapPanel from './TreeMapPanel';
import TreeMapChartModel from './TreeMapChartModel';

const log = Log.module('@deephaven/js-plugin-treemap.DashboardPlugin');

export const OBJECT_TYPE = 'deephaven.plugin.treemap.TreeMap';

export type JsExportedObjectType = 'Table' | 'TableMap' | 'Figure';

export type JsWidgetExportedObject = {
  type: JsExportedObjectType;
  fetch: () => Promise<unknown>;
};

export type JsWidget = {
  type: string;
  getDataAsBase64: () => string;
  exportedObjects: JsWidgetExportedObject[];
};

export function isJsWidget(object: unknown): object is JsWidget {
  return typeof (object as JsWidget).getDataAsBase64 === 'function';
}

export function openTreeMapPanel({
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

  async function treeMapModelFetch() {
    const treeMapObject = await fetch();
    if (!isJsWidget(treeMapObject)) {
      throw new Error('Unexpected object in fetch');
    }
    const table = await treeMapObject.exportedObjects[0].fetch();
    return new TreeMapChartModel(table);
  }

  const metadata = { id: widgetId, name, type };
  const config = {
    type: 'react-component',
    component: TreeMapPanel.COMPONENT,
    props: {
      localDashboardId,
      id: panelId,
      metadata,
      fetch: treeMapModelFetch,
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
      if ((type as string) == OBJECT_TYPE) {
        log.info('Panel opened of type', type);
        openTreeMapPanel({ ...props, layout, localDashboardId: id });
        return;
      }
    },
    [id, layout]
  );

  useEffect(() => {
    const cleanups = [registerComponent(TreeMapPanel.COMPONENT, TreeMapPanel)];

    return () => {
      cleanups.forEach(cleanup => cleanup());
    };
  }, [registerComponent]);

  useListener(layout.eventHub, 'PanelEvent.OPEN', handlePanelOpen);

  return <></>;
};

export default DashboardPlugin;
