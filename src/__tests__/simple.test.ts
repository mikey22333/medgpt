// Simple test to verify Jest is working
describe('Simple Test', () => {
  it('should pass a simple test', () => {
    console.log('Running simple test');
    expect(1 + 1).toBe(2);
  });

  it('should test something else', () => {
    const value = 'hello';
    expect(value).toHaveLength(5);
  });
});
