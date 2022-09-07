export type InteractiveQueryInput<Props extends {} = {}> = {
  name: string;
  type: string;
  props: Props;
};

export type JsWidgetInput<T = any, Props extends {} = {}> = {
  queryInput: InteractiveQueryInput<Props>;

  type: string;

  // Update the value of this input
  setValue: (value: T) => void;
};

export type JsWidgetSliderInput = JsWidgetInput<
  number,
  { min: number; max: number; defaultValue: number }
> & {
  type: 'dh.slider';
};
export type JsWidgetTextInput = JsWidgetInput<
  string,
  { defaultValue: string }
> & {
  type: 'dh.text';
};

export function isSliderInput(
  input: JsWidgetInput
): input is JsWidgetSliderInput {
  return input.type === 'dh.slider';
}

export function isTextInput(input: JsWidgetInput): input is JsWidgetTextInput {
  return input.type === 'dh.text';
}
