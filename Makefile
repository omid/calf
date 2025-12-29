check:
	@yarn
	@yarn lint || true
	@yarn tsc || true
	@yarn outdated || true
	@ts-unused-exports tsconfig.json || true
	@depcheck || true
	@yarn audit || true
	@madge --circular --extensions ts,tsx ./ || true
	@yarn build

# Test targets
test:
	@yarn test

test-ui:
	@yarn test:ui

test-coverage:
	@yarn test:coverage
	@echo "Coverage report generated in coverage/"

test-e2e:
	@yarn test:e2e

test-e2e-ui:
	@yarn test:e2e:ui

test-e2e-debug:
	@yarn test:e2e:debug

# Run all tests (unit + E2E)
test-all: test-coverage test-e2e
	@echo "All tests completed!"

# Run tests in CI mode (non-interactive)
test-ci: test-coverage test-e2e
	@echo "CI tests completed!"

.PHONY: check test test-ui test-coverage test-e2e test-e2e-ui test-e2e-debug test-all test-ci
