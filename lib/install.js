var exec     = require('./child_process').exec;
var fs       = require('fs-promise');
var path     = require('path');
var inquirer = require('./inquirer');
var gituser  = require('git-user-info')();
var gconfig  = fs.readFileSync('.git/config', 'utf8');
var theme    = path.basename(process.cwd()).replace(/^mdcss-theme(?:-(\w+))?/, '$1');

var questions = [
	{
		name:    'title',
		message: 'Theme name: ',
		default: theme || undefined
	},
	{
		name:    'description',
		message: 'Theme description:'
	},
	{
		name:    'keywords',
		message: 'Theme keywords: mdcss, mdcss-theme, theme,'
	},
	{
		name:    'name',
		message: 'Your name:',
		default: gituser.name
	},
	{
		name:    'email',
		message: 'Your email:',
		default: gituser.email
	},
	{
		name:    'username',
		message: 'GitHub username:',
		default: (gconfig.match(/([^\n:]+)\/mdcss-theme/) || [])[1]
	}
];

var theme, repo, url;

inquirer.prompt(questions).then(function (results) {
	theme = 'mdcss-theme-' + results.title.replace(/\s+/g, '-').replace(/[^\w-]/g, '').toLowerCase();
	repo  = results.username + '/' + theme;
	url   = 'https://github.com/' + repo;

	fs.readJson('package.json').then(function (package) {
		// selectively overwrite with lib/package.json
		return fs.readJson('lib/package.json').then(function (newpackage) {
			Object.keys(newpackage).forEach(function (key) {
				package[key] = newpackage[key];
			});

			return package;
		});
	}).then(function (package) {
		// update package description
		package.name = theme;

		package.keywords = package.keywords.concat(results.keywords.trim().split(/\s*,\s*/));

		if (results.description) package.description = results.description;
		else delete package.description;

		if (results.name) {
			package.author = results.name;

			if (results.email) package.author += ' <' + results.email + '>';
		} else delete package.author;

		// update package urls
		package.repository.url = 'git+' + url + '.git';

		package.bugs.url = url + '/issues';

		package.homepage = 'git+' + url + '.git#readme';

		// update readme
		var readme = fs.readFileSync('lib/README.md', 'utf8')
		             .replace(/TITLE/g, results.title)
		             .replace(/THEME/g, theme)
		             .replace(/USERNAME/g, results.username);

		// update readme
		var testjs = fs.readFileSync('test.js', 'utf8')
		             .replace(/TITLE/g, results.title)
		             .replace(/THEME/g, theme)
		             .replace(/USERNAME/g, results.username);

		// update project
		return Promise.all([
			fs.remove('.git'),
			fs.remove('lib'),
			fs.remove('node_modules')
		]).then(function () {
			return Promise.all([
				fs.writeJson('package.json', package),
				fs.outputFile('README.md', readme),
				fs.outputFile('test.js', testjs)
			]);
		});
	}).then(function () {
		console.log('');
		console.log('Initializing...');

		return exec('git init');
	}).then(function () {
		return exec('git remote add origin git@github.com:' + repo + '.git');
	}).then(function () {
		return exec('npm install');
	}).then(function () {
		return exec('npm test');
	}).then(function () {
		return exec('git add .');
	});
});
