// Setup file for Jest tests
import '@testing-library/jest-dom';

// Mock any global objects or functions if needed
global.console = {
  ...console,
  // uncomment to ignore a specific log level
  // log: jest.fn(),
  // debug: jest.fn(),
  // info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Add any other test setup code here
