var mdcss   = require('mdcss');
var fs      = require('fs');
var plugin  = require('./');
var test    = require('tape');

test('TITLE', function (t) {
	t.plan(1);

	var options = {
		theme: plugin({
			title: 'THEME'
		}),
		destination: 'demo'
	};

	var inputPath  = 'assets/style.css';
	var inputCSS   = '';

	try {
		inputCSS = fs.readFileSync(inputPath,  'utf8');
	} catch (error) {
		fs.writeFileSync(inputPath, inputCSS);
	}

	mdcss.process(inputCSS, options).then(function (result) {
		t.equal(result.warnings().length, 0, 'THEME works');
	});
});
