import React, { useCallback, useEffect, useState } from 'react';
import {
  ChartPanel,
  type ChartPanelProps,
} from '@deephaven/dashboard-core-plugins';
import type { Table } from '@deephaven/jsapi-types';
import Log from '@deephaven/log';
import { assertNotNull } from '@deephaven/utils';
import { ChartTheme } from '@deephaven/chart';
import { useApi } from '@deephaven/jsapi-bootstrap';

const log = Log.module('@deephaven/js-plugin-ui/UiPanel');

export interface UiWidget {
  getDataAsBase64(): string;
  exportedObjects: { fetch(): Promise<Table> }[];
  sendMessage: (message: string, args: unknown[]) => void;
}

interface UiWidgetData {
  // deephaven: {
  //   mappings: Array<{
  //     table: number;
  //     data_columns: Record<string, string[]>;
  //   }>;
  //   is_user_set_template: boolean;
  //   is_user_set_color: boolean;
  // };
  // plotly: PlotlyDataUiConfig;
}

function getWidgetData(widgetInfo: UiWidget): UiWidgetData {
  return JSON.parse(atob(widgetInfo.getDataAsBase64()));
}

export interface UiPanelProps extends ChartPanelProps {
  fetch(): Promise<UiWidget>;
}

function UiPanel(props: UiPanelProps) {
  const dh = useApi();
  const { fetch, ...rest } = props;

  const [widget, setWidget] = useState<UiWidget | null>(null);

  useEffect(() => {
    async function loadObjects() {
      const widgetInfo = await fetch();
      log.info('MJB widgetInfo', widgetInfo);
      setWidget(widgetInfo);
    }
    loadObjects();
  }, [fetch]);

  // TODO: Render all the child objects

  return null;
  // const makeModel = useCallback(async () => {
  //   const widgetInfo = await fetch();
  //   const data = getWidgetData(widgetInfo);
  //   const { plotly, deephaven } = data;
  //   const isDefaultTemplate = !deephaven.is_user_set_template;
  //   const tableColumnReplacementMap = await getDataMappings(widgetInfo);
  //   return new UiChartModel(
  //     dh,
  //     tableColumnReplacementMap,
  //     plotly.data,
  //     plotly.Ui ?? {},
  //     isDefaultTemplate,
  //     ChartTheme
  //   );
  // }, [dh, fetch]);

  // return (
  //   <ChartPanel
  //     // eslint-disable-next-line react/jsx-props-no-spreading
  //     {...rest}
  //     makeModel={makeModel}
  //     Plotly={Plotly}
  //   />
  // );
}

UiPanel.displayName = 'UiPanel';

export default UiPanel;
