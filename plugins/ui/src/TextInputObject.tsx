import React, { useEffect, useState } from 'react';
import { useApi } from '@deephaven/jsapi-bootstrap';
import Log from '@deephaven/log';
import TextInputWidget from './TextInput';

const log = Log.module('@deephaven/js-plugin-ui/TextInputObject');

export interface TextInputObjectProps {
  object: TextInputWidget;
}

function TextInputObject(props: TextInputObjectProps) {
  const { object } = props;
  const dh = useApi();

  // log.info('MJB Object value is', object.getDataAsBase64());
  const [value, setValue] = useState(atob(object.getDataAsBase64()));

  useEffect(
    () =>
      object?.addEventListener(dh.Widget.EVENT_MESSAGE, event => {
        log.info('MJB event', event);
      }),
    [dh, object]
  );

  return (
    <div
      className="ui-text-input-object"
      style={{ position: 'relative', flexGrow: 0, flexShrink: 1 }}
    >
      <input
        type="text"
        value={value}
        className="form-control"
        onChange={event => {
          event.preventDefault();
          event.stopPropagation();

          const { value: newValue } = event.target;
          setValue(newValue);
          log.info('Sending message', newValue);
          object?.sendMessage(newValue, []);
        }}
      />
    </div>
  );
}

TextInputObject.displayName = 'TableObject';

export default TextInputObject;
