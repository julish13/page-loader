install: 
	npm install

publish:
	npm publish --dry-run

link:
	npm link

prettier:
	npx prettier --write ./src/ ./__tests__/ ./bin/

lint:
	npx eslint --fix ./src/ ./__tests__/ ./bin/

test:
	npm test

test-coverage:
	npm test -- --coverage --coverageProvider=v8