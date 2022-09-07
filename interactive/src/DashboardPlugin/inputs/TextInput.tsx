import { ChangeEvent, useCallback, useState } from 'react';
import { JsWidgetTextInput } from './InputTypes';

export const TextInput = ({
  input,
}: {
  input: JsWidgetTextInput;
}): JSX.Element => {
  const { queryInput } = input;
  const { props: inputProps } = queryInput;
  const [value, setValue] = useState(inputProps.defaultValue);
  const handleChange = useCallback(function onChange(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const newValue = event.target.value;
    setValue(newValue);
    input.setValue(newValue);
  },
  []);
  return (
    <div className="dh-slider-input">
      <label>{input.queryInput.name}</label>
      <input type="text" value={value} onChange={handleChange} />
      {value}
    </div>
  );
};

export default TextInput;
