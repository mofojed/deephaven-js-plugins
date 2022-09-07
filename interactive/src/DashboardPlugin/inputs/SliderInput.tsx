import { ChangeEvent, useCallback, useState } from 'react';
import { JsWidgetSliderInput } from './InputTypes';

export const SliderInput = ({
  input,
}: {
  input: JsWidgetSliderInput;
}): JSX.Element => {
  const { queryInput } = input;
  const { props: inputProps } = queryInput;
  const [value, setValue] = useState(inputProps.defaultValue);
  const handleChange = useCallback(function onChange(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const newValue = Number.parseInt(event.target.value);
    setValue(newValue);
    input.setValue(newValue);
  },
  []);
  return (
    <div className="dh-slider-input">
      <label>{input.queryInput.name}</label>
      <input
        type="range"
        min={inputProps.min}
        max={inputProps.max}
        value={value}
        onChange={handleChange}
      />
      {value}
    </div>
  );
};

export default SliderInput;
