check:
	@yarn
	@yarn lint || true
	@yarn tsc || true
	@yarn outdated || true
	@ts-unused-exports tsconfig.json || true
	@depcheck || true
	@yarn audit || true
	@madge --circular --extensions ts,tsx ./ || true