bin=./node_modules/.bin
$bin/vitest --run --dir test/vitest
$bin/playwright install
$bin/playwright install-deps
$bin/playwright test