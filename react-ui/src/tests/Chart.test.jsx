import { render, cleanup } from '@testing-library/react';
import Chart from '../components/Chart';

// jsdom has no layout engine or ResizeObserver; recharts' ResponsiveContainer needs both.
beforeAll(() => {
  globalThis.ResizeObserver = class {
    constructor(callback) { this.callback = callback; }
    observe(target) {
      this.callback([{ target, contentRect: { width: 600, height: 300 } }]);
    }
    unobserve() {}
    disconnect() {}
  };
});

afterEach(cleanup);

test('renders the chart inside a sized container without throwing', () => {
  const { getByText } = render(
    <div style={{ width: 600, height: 300 }}>
      <Chart />
    </div>
  );

  expect(getByText('Today')).toBeInTheDocument();
});
