import { Chart } from '@deephaven/chart';
import { LoadingOverlay } from '@deephaven/components';
import { DashboardPanelProps } from '@deephaven/dashboard';
import Log from '@deephaven/log';
import React, { ReactNode } from 'react';
import TreeMapChartModel from './TreeMapChartModel';
import './TreeMapPanel.scss';

const log = Log.module('TreeMapPanel');

type StateProps = {
  fetch: () => Promise<TreeMapChartModel>;
  metadata: {
    name: string;
  };
};

export type TreeMapPanelProps = DashboardPanelProps & StateProps;

export type TreeMapPanelState = {
  error?: unknown;
  model?: TreeMapChartModel;
};

/**
 * Panel for showing inputs for an interactive query
 */
export class TreeMapPanel extends React.Component<
  TreeMapPanelProps,
  TreeMapPanelState
> {
  static COMPONENT = '@deephaven/js-plugin-interactive.TreeMapPanel';
  outputPanelIds: Map<any, any>;

  constructor(props: TreeMapPanelProps) {
    super(props);

    this.outputPanelIds = new Map();

    this.state = {
      error: undefined,
      model: undefined,
    };
  }

  componentDidMount(): void {
    this.init();
  }

  async init(): Promise<void> {
    try {
      const { fetch } = this.props;
      const model = await fetch();
      this.setState({ model });
    } catch (e: unknown) {
      this.handleError(e);
    }
  }

  handleError(error: unknown): void {
    log.error(error);
    this.setState({ error, model: undefined });
  }

  render(): ReactNode {
    const { metadata } = this.props;
    const { name, type } = metadata;
    const { error, model } = this.state;
    const isLoading = error === undefined && model === undefined;
    const isLoaded = model !== undefined;
    const errorMessage = error ? `${error}` : undefined;

    return (
      <div className="treemap-panel-content">
        <div className="title">
          {name} ({type})
        </div>
        {isLoaded && <Chart model={model} />}
        <LoadingOverlay
          isLoading={isLoading}
          isLoaded={isLoaded}
          errorMessage={errorMessage}
        />
      </div>
    );
  }
}

export default TreeMapPanel;
