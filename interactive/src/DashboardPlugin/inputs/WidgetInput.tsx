import Log from '@deephaven/log';
import { isSliderInput, isTextInput, JsWidgetInput } from './InputTypes';
import SliderInput from './SliderInput';
import TextInput from './TextInput';

const log = Log.module('@deephaven/js-plugin-interactive/WidgetInput');

export const WidgetInput = ({
  input,
}: {
  input: JsWidgetInput;
}): JSX.Element => {
  if (isSliderInput(input)) {
    return <SliderInput input={input} />;
  }
  if (isTextInput(input)) {
    return <TextInput input={input} />;
  }
  log.info('Unrecognized widget', input.type);
  return null;
};

export default WidgetInput;
