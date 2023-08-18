import React, { useCallback, useEffect, useState } from 'react';
import type { Table } from '@deephaven/jsapi-types';
import Log from '@deephaven/log';
import { useApi } from '@deephaven/jsapi-bootstrap';
import { PanelProps } from '@deephaven/dashboard';
import TextInputWidget from './TextInput';

const log = Log.module('@deephaven/js-plugin-layout/TextInputPanel');

export interface TextInputPanelProps extends PanelProps {
  fetch(): Promise<TextInputWidget>;
}

function TextInputPanel(props: TextInputPanelProps) {
  const dh = useApi();
  const { fetch, ...rest } = props;

  const [widget, setWidget] = useState<TextInputWidget | null>(null);
  const [value, setValue] = useState<string>('');

  useEffect(() => {
    async function loadObjects() {
      const widgetInfo = await fetch();
      log.info('MJB widgetInfo', widgetInfo);
      setWidget(widgetInfo);
    }
    loadObjects();
  }, [fetch]);

  useEffect(
    () =>
      widget?.addEventListener(dh.Widget.EVENT_MESSAGE, event => {
        log.info('MJB event', event);
      }),
    [widget]
  );

  return (
    <input
      type="text"
      value={value}
      className="form-control"
      onChange={event => {
        event.preventDefault();
        event.stopPropagation();

        const { value: newValue } = event.target;
        setValue(newValue);
        widget?.sendMessage(newValue, []);
      }}
    />
  );
}

TextInputPanel.displayName = 'TextInputPanel';

export default TextInputPanel;
