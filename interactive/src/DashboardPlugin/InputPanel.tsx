import { Button, LoadingOverlay } from '@deephaven/components';
import { DashboardPanelProps, PanelEvent } from '@deephaven/dashboard';
import Log from '@deephaven/log';
import React, { ReactNode } from 'react';
import ReactJson from 'react-json-view';
import './InputPanel.scss';

const log = Log.module('InputPanel');

type StateProps = {
  fetch: () => Promise<unknown>;
  metadata: {
    name: string;
  };
};

export type JsExportedObjectType = 'Table' | 'TableMap' | 'Figure';

export type JsWidgetExportedObject = {
  type: JsExportedObjectType;
  fetch: () => Promise<unknown>;
};

export type InputPanelProps = DashboardPanelProps & StateProps;

export type JsWidget = {
  type: string;
  getDataAsBase64: () => string;
  exportedObjects: JsWidgetExportedObject[];
};

// Only have two types for now
export type JsWidgetInputType = 'slider' | 'text';

export type JsWidgetInput<T = string> = {
  type: JsWidgetInputType;

  value: T;

  // Update the value of this input
  setValue: (value: T) => Promise<void>;
};

export type InputPanelState = {
  error?: unknown;
  inputs?: Record<string, JsWidgetInput>;
};

export function isJsWidget(object: unknown): object is JsWidget {
  return typeof (object as JsWidget).getDataAsBase64 === 'function';
}

/**
 * Panel for showing inputs for an interactive query
 */
export class InputPanel extends React.Component<
  InputPanelProps,
  InputPanelState
> {
  static COMPONENT = '@deephaven/js-plugin-interactive.InputPanel';

  constructor(props: InputPanelProps) {
    super(props);

    this.handleError = this.handleError.bind(this);
    this.handleExportedTypeClick = this.handleExportedTypeClick.bind(this);

    this.state = {
      error: undefined,
      object: undefined,
    };
  }

  componentDidMount(): void {
    this.fetchObject();
  }

  async fetchObject(): Promise<void> {
    try {
      const { fetch, metadata } = this.props;
      log.info('fetchObject...', metadata);
      const object = await fetch();
      log.info('Object fetched: ', object);
      this.setState({ object });
    } catch (e: unknown) {
      this.handleError(e);
    }
  }

  handleExportedTypeClick(
    exportedObject: JsWidgetExportedObject,
    index: number
  ): void {
    log.info('handleExportedTypeClick', exportedObject, index);

    const { type } = exportedObject;
    log.info('Opening object', index);

    const { glEventHub, metadata } = this.props;
    const { name } = metadata;
    const openOptions = {
      fetch: () => exportedObject.fetch(),
      widget: { name: `${name}/${index}`, type },
    };

    log.info('openWidget', openOptions);

    glEventHub.emit(PanelEvent.OPEN, openOptions);
  }

  handleError(error: unknown): void {
    log.error(error);
    this.setState({ error, object: undefined });
  }

  renderObjectData(): JSX.Element {
    const { object } = this.state;
    if (!object) {
      return null;
    }
    log.info('Rendering object data');
    if (!isJsWidget(object)) {
      return <div className="error-message">Object is not a widget</div>;
    }
    const data = object.getDataAsBase64();
    try {
      const dataJson = JSON.parse(atob(data));
      return <ReactJson src={dataJson} theme="monokai" />;
    } catch (e) {
      return <div className="base64-data">{data}</div>;
    }
  }

  renderExportedObjectList(): JSX.Element {
    const { object } = this.state;
    if (!object || !isJsWidget(object)) {
      return null;
    }

    return (
      <>
        {object.exportedObjects.map((exportedObject, index) => (
          <Button
            // eslint-disable-next-line react/no-array-index-key
            key={index}
            kind="ghost"
            onClick={() => this.handleExportedTypeClick(exportedObject, index)}
          >
            {exportedObject.type} {index}
          </Button>
        ))}
      </>
    );
  }

  render(): ReactNode {
    const { metadata } = this.props;
    const { name, type } = metadata;
    const { error, object } = this.state;
    const isLoading = error === undefined && object === undefined;
    const isLoaded = object !== undefined;
    const errorMessage = error ? `${error}` : undefined;

    return (
      <div className="object-panel-content">
        <div className="title">
          {name} ({type})
        </div>
        {isLoaded && (
          <>
            <div className="object-panel-exported-tables">
              {this.renderExportedObjectList()}
            </div>
            <div className="object-panel-data">{this.renderObjectData()}</div>
          </>
        )}
        <LoadingOverlay
          isLoading={isLoading}
          isLoaded={isLoaded}
          errorMessage={errorMessage}
        />
      </div>
    );
  }
}

export default ObjectPanel;
