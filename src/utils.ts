export const Temperature = {
  toFahrenheit: (c: number) => (c * 9) / 5 + 32,
  toCelsius: (f: number) => ((f - 32) * 5) / 9,
} as const;
