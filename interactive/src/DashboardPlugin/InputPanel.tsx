import { Button, LoadingOverlay } from '@deephaven/components';
import { DashboardPanelProps, PanelEvent } from '@deephaven/dashboard';
import { Table } from '@deephaven/jsapi-shim';
import Log from '@deephaven/log';
import debounce from 'lodash.debounce';
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

export type InteractiveQueryInput<T = any> = {
  name: string;
  type: string;
  value: T;
};

export type InteractiveQuerySliderInput = InteractiveQueryInput<number> & {
  type: 'slider';
  min: number;
  max: number;
};

export type InteractiveQueryTextInput = InteractiveQueryInput<string> & {
  type: 'text';
};

export type InputPanelProps = DashboardPanelProps & StateProps;

export type JsWidget = {
  type: string;
  getDataAsBase64: () => string;
  exportedObjects: JsWidgetExportedObject[];
};

// Only have two types for now
export type JsWidgetInputType = 'slider' | 'text';

export type JsWidgetInput<T = any> = {
  queryInput: InteractiveQueryInput<T>;

  type: JsWidgetInputType;

  // Update the value of this input
  setValue: (value: T) => void;
};

export type JsWidgetSliderInput = JsWidgetInput<number> & { type: 'slider' };
export type JsWidgetTextInput = JsWidgetInput<number> & { type: 'text' };

export type InteractiveQuery = {
  revision: number;
  inputs: InteractiveQueryInput[];
};

export type InputPanelState = {
  error?: unknown;
  object?: JsWidget;
  inputs?: JsWidgetInput[];
  revisionTable?: Table;
};

export function isJsWidget(object: unknown): object is JsWidget {
  return typeof (object as JsWidget).getDataAsBase64 === 'function';
}

export function isSliderInput(
  input: JsWidgetInput
): input is JsWidgetSliderInput {
  return input.type === 'slider';
}

export function isTextInput(input: JsWidgetInput): input is JsWidgetTextInput {
  return input.type === 'text';
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
      inputs: [],
      revisionTable: undefined,
    };
  }

  componentDidMount(): void {
    this.init();
  }

  async init(): Promise<void> {
    try {
      const { fetch, metadata } = this.props;
      log.info('fetchObject...', metadata);
      const object = await fetch();
      log.info('Object fetched: ', object);
      if (!isJsWidget(object)) {
        this.handleError(new Error('Unknown object type'));
        return;
      }

      const json = object.getDataAsBase64();
      const interactiveQuery = JSON.parse(json) as InteractiveQuery;

      const exportedObjects = [...object.exportedObjects];
      // First table is the revision table, then inputs, then outputs
      const revisionTable = exportedObjects.pop() as unknown as Table;
      const exportedInputTableObjects = exportedObjects.splice(
        0,
        interactiveQuery.inputs.length
      );
      const inputPromises: Promise<unknown>[] = interactiveQuery.inputs.map(
        async (input, i) => {
          const inputTable = await exportedInputTableObjects[i].fetch();

          const debouncedSetValue = debounce((value: unknown) => {
            const newRow = { key: '0', value };
            return (inputTable as any).inputTable.addRows([newRow]);
          });

          return {
            queryInput: input,
            type: input.type,
            setValue: (value: unknown) => {
              input.value = value;
              debouncedSetValue(value);
            },
          };
        }
      );

      const inputs: JsWidgetInput[] = (await Promise.all(
        inputPromises
      )) as JsWidgetInput[];

      this.setState({ inputs, object, revisionTable });
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
      const dataJson = JSON.parse(Buffer.from(data, 'base64').toString());
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
    const { error, inputs, object } = this.state;
    const isLoading = error === undefined && object === undefined;
    const isLoaded = object !== undefined;
    const errorMessage = error ? `${error}` : undefined;

    return (
      <div className="input-panel-content">
        <div className="title">
          {name} ({type})
        </div>
        {isLoaded && (
          <>
            <div className="input-panel-inputs">
              {inputs.map(widgetInput => {
                if (isSliderInput(widgetInput)) {
                  return (
                    <input
                      type="range"
                      value={widgetInput.queryInput.value}
                      min={-100}
                      max={100}
                    ></input>
                  );
                }
                if (isTextInput(widgetInput)) {
                  return (
                    <input
                      type="text"
                      value={widgetInput.queryInput.value}
                    ></input>
                  );
                }
                return null;
              })}
            </div>
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

export default InputPanel;
