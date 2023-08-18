export interface TextInputWidget {
  addEventListener: (
    type: string,
    listener: (event: unknown) => void
  ) => () => void;
  getDataAsBase64(): string;
  sendMessage: (message: string, args: unknown[]) => void;
}

export default TextInputWidget;
