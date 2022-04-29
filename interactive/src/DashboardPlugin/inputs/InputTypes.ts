export type InteractiveQueryInput<T = any> = {
  name: string;
  type: string;
  value: T;
};

export type InteractiveQuerySliderInput = InteractiveQueryInput<number> & {
  type: 'SliderType';
  min: number;
  max: number;
};

export type InteractiveQueryTextInput = InteractiveQueryInput<string> & {
  type: 'text';
};

// Only have two types for now
export type JsWidgetInputType = 'SliderType' | 'text';

export type JsWidgetInput<T = any> = {
  queryInput: InteractiveQueryInput<T>;

  type: JsWidgetInputType;

  // Update the value of this input
  setValue: (value: T) => void;
};

export type JsWidgetSliderInput = JsWidgetInput<number> & {
  type: 'SliderType';
};
export type JsWidgetTextInput = JsWidgetInput<number> & { type: 'text' };

export function isSliderInput(
  input: JsWidgetInput
): input is JsWidgetSliderInput {
  return input.type === 'SliderType';
}

export function isTextInput(input: JsWidgetInput): input is JsWidgetTextInput {
  return input.type === 'text';
}
