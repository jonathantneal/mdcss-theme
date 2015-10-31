var child_process = require('child_process');

module.exports = {
	exec: function (command) {
		var args = 1 in arguments ? [command, arguments[1]] : [command];

		return new Promise(function (resolve, reject) {
			child_process.exec.apply(child_process, args.concat(function (error, stdout, stderr) {
				if (error) reject(error);

				resolve({
					childProcess: this,
					stdout: stdout,
					stderr: stderr
				});
			}));
		});
	},
	then: {
		exec: function (command) {
			var args = arguments;

			return function () {
				return module.exports.apply(child_process, args);
			};
		}
	}
};
