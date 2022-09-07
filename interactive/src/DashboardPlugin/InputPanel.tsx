import { LoadingOverlay } from '@deephaven/components';
import { DashboardPanelProps, PanelEvent } from '@deephaven/dashboard';
import { Table } from '@deephaven/jsapi-shim';
import Log from '@deephaven/log';
import debounce from 'lodash.debounce';
import React, { ReactNode } from 'react';
import shortid from 'shortid';
import { InteractiveQueryInput, JsWidgetInput } from './inputs/InputTypes';
import './InputPanel.scss';
import WidgetInput from './inputs/WidgetInput';

const log = Log.module('@deephaven/js-plugin-interactive/InputPanel');

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
    this.handleRevisionUpdated = this.handleRevisionUpdated.bind(this);
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

      log.info('refreshOutputs exportedObjects', object.exportedObjects);

      // Slice off just the outputs
      const outputObjects = object.exportedObjects.slice(
        1 + interactiveQuery.inputs.length
      );
      log.info('outputObjects:', outputObjects);
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
      const revisionTableObject = exportedObjects.shift();
      const exportedInputTableObjects = exportedObjects.splice(
        0,
        interactiveQuery.inputs.length
      );
      const inputPromises: Promise<unknown>[] = interactiveQuery.inputs.map(
        async (input, i) => {
          const table = (await exportedInputTableObjects[i].fetch()) as Table;
          const inputTable = await (table as any).inputTable();

          log.info('Got input table', inputTable);

          table.setViewport(0, 0);

          return {
            queryInput: input,
            type: input.type,
            setValue: debounce(async (value: unknown) => {
              log.info('setValue', value);
              const newRow = { key: '0', value };
              const result = await inputTable.addRows([newRow]);
              log.info('setValue result', result);
              return result;
            }, 150),
          };
        }
      );

      const inputs: JsWidgetInput[] = (await Promise.all(
        inputPromises
      )) as JsWidgetInput[];
      const revisionTable = (await revisionTableObject.fetch()) as Table;

      revisionTable.addEventListener(
        dh.Table.EVENT_UPDATED,
        this.handleRevisionUpdated
      );
      revisionTable.setViewport(0, 0, [revisionTable.findColumn('revision')]);

      log.info('inputs', inputs);
      log.info('revisionTable', revisionTable);
      this.setState({ inputs, object, revisionTable });
      this.refreshOutputs();
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

  handleRevisionUpdated(event): void {
    log.info('Revision updated', event);
    this.refreshOutputs();
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
              {inputs.map(widgetInput => (
                <WidgetInput
                  key={widgetInput.queryInput.name}
                  input={widgetInput}
                />
              ))}
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
