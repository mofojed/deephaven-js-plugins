import { ChangeEvent, useCallback, useState } from 'react';
import { JsWidgetSliderInput } from './InputTypes';

export const SliderInput = ({
  input,
}: {
  input: JsWidgetSliderInput;
}): JSX.Element => {
  const [value, setValue] = useState(input.queryInput.value);
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
        min={-100}
        max={100}
        value={value}
        onChange={handleChange}
      />
      {value}
    </div>
  );
};

export default SliderInput;
