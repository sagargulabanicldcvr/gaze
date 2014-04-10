'use strict';

var gaze = require('../index.js');
var path = require('path');
var fs = require('fs');
var helper = require('./helper');

var fixtures = path.resolve(__dirname, 'fixtures');

// Clean up helper to call in setUp and tearDown
function cleanUp(done) {
  [
    'added.js',
    'nested/added.js',
  ].forEach(function(d) {
    var p = path.resolve(__dirname, 'fixtures', d);
    if (fs.existsSync(p)) { fs.unlinkSync(p); }
  });
  done();
}

exports.patterns = {
  setUp: function(done) {
    process.chdir(path.resolve(__dirname, 'fixtures'));
    cleanUp(done);
  },
  tearDown: cleanUp,
  negate: function(test) {
    test.expect(1);
    gaze(['**/*.js', '!nested/**/*.js'], function(err, watcher) {
      watcher.on('added', function(filepath) {
        var expected = path.relative(process.cwd(), filepath);
        test.equal(path.join('added.js'), expected);
        watcher.close();
      });
      // dont add
      fs.writeFileSync(path.resolve(__dirname, 'fixtures', 'nested', 'added.js'), 'var added = true;');
      setTimeout(function() {
        // should add
        fs.writeFileSync(path.resolve(__dirname, 'fixtures', 'added.js'), 'var added = true;');
      }, 1000);
      watcher.on('end', test.done);
    });
  },
  dotSlash: function(test) {
    test.expect(2);
    gaze('./nested/**/*', function(err, watcher) {
      watcher.on('end', test.done);
      watcher.on('all', function(status, filepath) {
        test.equal(status, 'changed');
        test.equal(path.relative(fixtures, filepath), path.join('nested', 'one.js'));
        watcher.close();
      });
      fs.writeFile(path.join(fixtures, 'nested', 'one.js'), 'var one = true;');
    });
  },
};
