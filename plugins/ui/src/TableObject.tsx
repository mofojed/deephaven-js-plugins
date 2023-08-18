import React, { useEffect, useState } from 'react';
import {
  IrisGrid,
  IrisGridModel,
  IrisGridModelFactory,
} from '@deephaven/iris-grid';
import { useApi } from '@deephaven/jsapi-bootstrap';
import type { Table } from '@deephaven/jsapi-types';

export interface TableObjectProps {
  object: Table;
}

function TableObject(props: TableObjectProps) {
  const { object } = props;
  const dh = useApi();
  const [model, setModel] = useState<IrisGridModel>();

  useEffect(() => {
    async function loadModel() {
      const newModel = await IrisGridModelFactory.makeModel(dh, object);
      // console.log('MJB new model is', newModel);
      setModel(newModel);
    }
    loadModel();
  }, [dh, object]);
  return (
    <div
      className="ui-table-object"
      style={{ position: 'relative', flexGrow: 1, flexShrink: 1, flexBasis: 1 }}
    >
      {/* {`Model is ${model}, IrisGrid is ${IrisGrid}`} */}
      {model && <IrisGrid model={model} />}
    </div>
  );
}

TableObject.displayName = 'TableObject';

export default TableObject;
