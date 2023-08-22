import React from 'react';
import type { Figure, Table } from '@deephaven/jsapi-types';
import Log from '@deephaven/log';
import TableObject from './TableObject';
import FigureObject from './FigureObject';
import TextInputObject from './TextInputObject';
import TextInputWidget from './TextInput';

const log = Log.module('@deephaven/js-plugin-ui/ComponentObject');

export interface ComponentObjectProps {
  object: Table | Figure | TextInputWidget;
}

function ComponentObject(props: ComponentObjectProps) {
  const { object } = props;
  log.info('Object is', object);

  // TODO: Need a structured way to actually get the proper type from the server...
  if ((object as any).getViewportData != null) {
    return <TableObject object={object as Table} />;
  }
  if ((object as any).subscribe != null) {
    return <FigureObject object={object as Figure} />;
  }

  // TODO: Need a way to load specific objects as components via the plugins...
  return <TextInputObject object={object as TextInputWidget} />;
}

ComponentObject.displayName = 'ComponentObject';

export default ComponentObject;
