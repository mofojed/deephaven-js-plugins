import { Button, LoadingOverlay } from '@deephaven/components';
import { DashboardPanelProps, PanelEvent } from '@deephaven/dashboard';
import { Table } from '@deephaven/jsapi-shim';
import Log from '@deephaven/log';
import debounce from 'lodash.debounce';
import React, { ReactNode } from 'react';
import shortid from 'shortid';
import {
  InteractiveQueryInput,
  isSliderInput,
  isTextInput,
  JsWidgetInput,
} from './inputs/InputTypes';
import './InputPanel.scss';
import SliderInput from './inputs/SliderInput';

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

/**
 * Panel for showing inputs for an interactive query
 */
export class InputPanel extends React.Component<
  InputPanelProps,
  InputPanelState
> {
  static COMPONENT = '@deephaven/js-plugin-interactive.InputPanel';
  outputPanelIds: Map<any, any>;

  constructor(props: InputPanelProps) {
    super(props);

    this.handleError = this.handleError.bind(this);
    this.handleExportedTypeClick = this.handleExportedTypeClick.bind(this);
    this.refreshOutputs = debounce(this.refreshOutputs.bind(this), 150);

    this.outputPanelIds = new Map();

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

  async refreshOutputs(): Promise<void> {
    // We need to fetch the object again, to get the outputs
    try {
      log.info('refreshOutputs...');
      const { fetch } = this.props;
      const object = await fetch();
      if (!isJsWidget(object)) {
        log.info('Unknown object type');
        this.handleError(new Error('Unknown object type'));
        return;
      }

      const json = atob(object.getDataAsBase64());
      const interactiveQuery = JSON.parse(json) as InteractiveQuery;

      // Slice off just the outputs
      const outputObjects = object.exportedObjects.slice(
        1 + interactiveQuery.inputs.length
      );
      for (let i = 0; i < outputObjects.length; i += 1) {
        const { glEventHub, metadata } = this.props;
        const { name } = metadata;
        const outputObject = outputObjects[i];
        const panelId = this.outputPanelIds.get(i) ?? shortid();
        this.outputPanelIds.set(i, panelId);
        const openOptions = {
          fetch: () => outputObject.fetch(),
          widget: { name: `${name}/${i}`, type: outputObject.type },
          panelId,
        };

        log.info('openWidget', openOptions);

        glEventHub.emit(PanelEvent.OPEN, openOptions);
      }
    } catch (e: unknown) {
      this.handleError(e);
    }
  }

  async init(): Promise<void> {
    try {
      const { fetch, metadata } = this.props;
      log.info('fetchObject...', metadata);
      const object = await fetch();
      log.info('Object fetched: ', object);
      if (!isJsWidget(object)) {
        log.info('Unknown object type');
        this.handleError(new Error('Unknown object type'));
        return;
      }

      const json = atob(object.getDataAsBase64());
      const interactiveQuery = JSON.parse(json) as InteractiveQuery;

      const exportedObjects = [...object.exportedObjects];

      log.info('interactiveQuery', interactiveQuery);
      log.info('exportedObjects', exportedObjects);

      // First table is the revision table, then inputs, then outputs
      const revisionTable = exportedObjects.pop() as unknown as Table;
      const exportedInputTableObjects = exportedObjects.splice(
        0,
        interactiveQuery.inputs.length
      );
      const inputPromises: Promise<unknown>[] = interactiveQuery.inputs.map(
        async (input, i) => {
          const table = await exportedInputTableObjects[i].fetch();
          const inputTable = await (table as any).inputTable();

          log.info('Got input table', inputTable);

          return {
            queryInput: input,
            type: input.type,
            setValue: debounce((value: unknown) => {
              log.info('setValue', value);
              const newRow = { key: '0', value };
              this.refreshOutputs();
              return inputTable.addRows([newRow]);
            }, 150),
          };
        }
      );

      const inputs: JsWidgetInput[] = (await Promise.all(
        inputPromises
      )) as JsWidgetInput[];

      log.info('inputs', inputs);
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
                log.info(
                  'widgetInput is',
                  widgetInput,
                  'isSliderInput is',
                  isSliderInput
                );
                if (isSliderInput(widgetInput)) {
                  return (
                    <SliderInput
                      key={widgetInput.queryInput.name}
                      input={widgetInput}
                    />
                  );
                }
                if (isTextInput(widgetInput)) {
                  return (
                    <input
                      key={widgetInput.queryInput.name}
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
