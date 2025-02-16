/* -*- Mode: js; js-indent-level: 2; -*- */
/*
 * Copyright 2011 Mozilla Foundation and contributors
 * Licensed under the New BSD license. See LICENSE or:
 * http://opensource.org/licenses/BSD-3-Clause
 */

var SourceMapGenerator = require('../lib/source-map-generator').SourceMapGenerator;
var SourceMapConsumer = require('../lib/source-map-consumer').SourceMapConsumer;
var SourceNode = require('../lib/source-node').SourceNode;
var util = require('./util');

exports['test some simple stuff'] = function (assert) {
  var map = new SourceMapGenerator({
    file: 'foo.js',
    sourceRoot: '.'
  }).toJSON();
  assert.ok('file' in map);
  assert.ok('sourceRoot' in map);

  var map = new SourceMapGenerator().toJSON();
  assert.ok(!('file' in map));
  assert.ok(!('sourceRoot' in map));
};

exports['test JSON serialization'] = function (assert) {
  var map = new SourceMapGenerator({
    file: 'foo.js',
    sourceRoot: '.'
  });
  assert.equal(map.toString(), JSON.stringify(map));
};

exports['test adding mappings (case 1)'] = function (assert) {
  var map = new SourceMapGenerator({
    file: 'generated-foo.js',
    sourceRoot: '.'
  });

  assert.doesNotThrow(function () {
    map.addMapping({
      generated: { line: 1, column: 1 }
    });
  });
};

exports['test adding mappings (case 2)'] = function (assert) {
  var map = new SourceMapGenerator({
    file: 'generated-foo.js',
    sourceRoot: '.'
  });

  assert.doesNotThrow(function () {
    map.addMapping({
      generated: { line: 1, column: 1 },
      source: 'bar.js',
      original: { line: 1, column: 1 }
    });
  });
};

exports['test adding mappings (case 3)'] = function (assert) {
  var map = new SourceMapGenerator({
    file: 'generated-foo.js',
    sourceRoot: '.'
  });

  assert.doesNotThrow(function () {
    map.addMapping({
      generated: { line: 1, column: 1 },
      source: 'bar.js',
      original: { line: 1, column: 1 },
      name: 'someToken'
    });
  });
};

exports['test adding mappings (invalid)'] = function (assert) {
  var map = new SourceMapGenerator({
    file: 'generated-foo.js',
    sourceRoot: '.'
  });

  // Not enough info.
  assert.throws(function () {
    map.addMapping({});
  });
};

exports['test adding mappings with skipValidation'] = function (assert) {
  var map = new SourceMapGenerator({
    file: 'generated-foo.js',
    sourceRoot: '.',
    skipValidation: true
  });

  // Not enough info, caught by `util.getArgs`
  assert.throws(function () {
    map.addMapping({});
  });

  // Original file position, but no source. Not checked.
  assert.doesNotThrow(function () {
    map.addMapping({
      generated: { line: 1, column: 1 },
      original: { line: 1, column: 1 }
    });
  });
};

exports['test that the correct mappings are being generated'] = function (assert) {
  var map = new SourceMapGenerator({
    file: 'min.js',
    sourceRoot: '/the/root'
  });

  map.addMapping({
    generated: { line: 1, column: 1 },
    original: { line: 1, column: 1 },
    source: 'one.js'
  });
  map.addMapping({
    generated: { line: 1, column: 5 },
    original: { line: 1, column: 5 },
    source: 'one.js'
  });
  map.addMapping({
    generated: { line: 1, column: 9 },
    original: { line: 1, column: 11 },
    source: 'one.js'
  });
  map.addMapping({
    generated: { line: 1, column: 18 },
    original: { line: 1, column: 21 },
    source: 'one.js',
    name: 'bar'
  });
  map.addMapping({
    generated: { line: 1, column: 21 },
    original: { line: 2, column: 3 },
    source: 'one.js'
  });
  map.addMapping({
    generated: { line: 1, column: 28 },
    original: { line: 2, column: 10 },
    source: 'one.js',
    name: 'baz'
  });
  map.addMapping({
    generated: { line: 1, column: 32 },
    original: { line: 2, column: 14 },
    source: 'one.js',
    name: 'bar'
  });

  map.addMapping({
    generated: { line: 2, column: 1 },
    original: { line: 1, column: 1 },
    source: 'two.js'
  });
  map.addMapping({
    generated: { line: 2, column: 5 },
    original: { line: 1, column: 5 },
    source: 'two.js'
  });
  map.addMapping({
    generated: { line: 2, column: 9 },
    original: { line: 1, column: 11 },
    source: 'two.js'
  });
  map.addMapping({
    generated: { line: 2, column: 18 },
    original: { line: 1, column: 21 },
    source: 'two.js',
    name: 'n'
  });
  map.addMapping({
    generated: { line: 2, column: 21 },
    original: { line: 2, column: 3 },
    source: 'two.js'
  });
  map.addMapping({
    generated: { line: 2, column: 28 },
    original: { line: 2, column: 10 },
    source: 'two.js',
    name: 'n'
  });

  map = JSON.parse(map.toString());

  util.assertEqualMaps(assert, map, util.testMap);
};

exports['test that adding a mapping with an empty string name does not break generation'] = function (assert) {
  var map = new SourceMapGenerator({
    file: 'generated-foo.js',
    sourceRoot: '.'
  });

  map.addMapping({
    generated: { line: 1, column: 1 },
    source: 'bar.js',
    original: { line: 1, column: 1 },
    name: ''
  });

  assert.doesNotThrow(function () {
    JSON.parse(map.toString());
  });
};

exports['test that source content can be set'] = function (assert) {
  var map = new SourceMapGenerator({
    file: 'min.js',
    sourceRoot: '/the/root'
  });
  map.addMapping({
    generated: { line: 1, column: 1 },
    original: { line: 1, column: 1 },
    source: 'one.js'
  });
  map.addMapping({
    generated: { line: 2, column: 1 },
    original: { line: 1, column: 1 },
    source: 'two.js'
  });
  map.setSourceContent('one.js', 'one file content');

  map = JSON.parse(map.toString());
  assert.equal(map.sources[0], 'one.js');
  assert.equal(map.sources[1], 'two.js');
  assert.equal(map.sourcesContent[0], 'one file content');
  assert.equal(map.sourcesContent[1], null);
};

exports['test .fromSourceMap'] = function (assert) {
  var map = SourceMapGenerator.fromSourceMap(new SourceMapConsumer(util.testMap));
  util.assertEqualMaps(assert, map.toJSON(), util.testMap);
};

exports['test .fromSourceMap with sourcesContent'] = function (assert) {
  var map = SourceMapGenerator.fromSourceMap(
    new SourceMapConsumer(util.testMapWithSourcesContent));
  util.assertEqualMaps(assert, map.toJSON(), util.testMapWithSourcesContent);
};

exports['test .fromSourceMap with single source'] = function (assert) {
  var map = SourceMapGenerator.fromSourceMap(
      new SourceMapConsumer(util.testMapSingleSource));
  util.assertEqualMaps(assert, map.toJSON(), util.testMapSingleSource);
};

exports['test .fromSourceMap with empty mappings'] = function (assert) {
  var map = SourceMapGenerator.fromSourceMap(
    new SourceMapConsumer(util.testMapEmptyMappings));
  util.assertEqualMaps(assert, map.toJSON(), util.testMapEmptyMappings);
};

exports['test .fromSourceMap with empty mappings and relative sources'] = function (assert) {
  var map = SourceMapGenerator.fromSourceMap(
    new SourceMapConsumer(util.testMapEmptyMappingsRelativeSources));
  util.assertEqualMaps(assert, map.toJSON(), util.testMapEmptyMappingsRelativeSources_generatedExpected);
};

exports['test .fromSourceMap with multiple sources where mappings refers only to single source'] = function (assert) {
    var map = SourceMapGenerator.fromSourceMap(
        new SourceMapConsumer(util.testMapMultiSourcesMappingRefersSingleSourceOnly));
    util.assertEqualMaps(assert, map.toJSON(), util.testMapMultiSourcesMappingRefersSingleSourceOnly);
};

exports['test applySourceMap'] = function (assert) {
  var node = new SourceNode(null, null, null, [
    new SourceNode(2, 0, 'fileX', 'lineX2\n'),
    'genA1\n',
    new SourceNode(2, 0, 'fileY', 'lineY2\n'),
    'genA2\n',
    new SourceNode(1, 0, 'fileX', 'lineX1\n'),
    'genA3\n',
    new SourceNode(1, 0, 'fileY', 'lineY1\n')
  ]);
  var mapStep1 = node.toStringWithSourceMap({
    file: 'fileA'
  }).map;
  mapStep1.setSourceContent('fileX', 'lineX1\nlineX2\n');
  mapStep1 = mapStep1.toJSON();

  node = new SourceNode(null, null, null, [
    'gen1\n',
    new SourceNode(1, 0, 'fileA', 'lineA1\n'),
    new SourceNode(2, 0, 'fileA', 'lineA2\n'),
    new SourceNode(3, 0, 'fileA', 'lineA3\n'),
    new SourceNode(4, 0, 'fileA', 'lineA4\n'),
    new SourceNode(1, 0, 'fileB', 'lineB1\n'),
    new SourceNode(2, 0, 'fileB', 'lineB2\n'),
    'gen2\n'
  ]);
  var mapStep2 = node.toStringWithSourceMap({
    file: 'fileGen'
  }).map;
  mapStep2.setSourceContent('fileB', 'lineB1\nlineB2\n');
  mapStep2 = mapStep2.toJSON();

  node = new SourceNode(null, null, null, [
    'gen1\n',
    new SourceNode(2, 0, 'fileX', 'lineA1\n'),
    new SourceNode(2, 0, 'fileA', 'lineA2\n'),
    new SourceNode(2, 0, 'fileY', 'lineA3\n'),
    new SourceNode(4, 0, 'fileA', 'lineA4\n'),
    new SourceNode(1, 0, 'fileB', 'lineB1\n'),
    new SourceNode(2, 0, 'fileB', 'lineB2\n'),
    'gen2\n'
  ]);
  var expectedMap = node.toStringWithSourceMap({
    file: 'fileGen'
  }).map;
  expectedMap.setSourceContent('fileX', 'lineX1\nlineX2\n');
  expectedMap.setSourceContent('fileB', 'lineB1\nlineB2\n');
  expectedMap = expectedMap.toJSON();

  // apply source map "mapStep1" to "mapStep2"
  var generator = SourceMapGenerator.fromSourceMap(new SourceMapConsumer(mapStep2));
  generator.applySourceMap(new SourceMapConsumer(mapStep1));
  var actualMap = generator.toJSON();

  util.assertEqualMaps(assert, actualMap, expectedMap);
};

exports['test applySourceMap throws when file is missing'] = function (assert) {
  var map = new SourceMapGenerator({
    file: 'test.js'
  });
  var map2 = new SourceMapGenerator();
  assert.throws(function() {
    map.applySourceMap(new SourceMapConsumer(map2.toJSON()));
  });
};

exports['test the two additional parameters of applySourceMap'] = function (assert) {
  // Assume the following directory structure:
  //
  // http://foo.org/
  //   bar.coffee
  //   app/
  //     coffee/
  //       foo.coffee
  //     temp/
  //       bundle.js
  //       temp_maps/
  //         bundle.js.map
  //     public/
  //       bundle.min.js
  //       bundle.min.js.map
  //
  // http://www.example.com/
  //   baz.coffee

  var bundleMap = new SourceMapGenerator({
    file: 'bundle.js'
  });
  bundleMap.addMapping({
    generated: { line: 3, column: 3 },
    original: { line: 2, column: 2 },
    source: '../../coffee/foo.coffee'
  });
  bundleMap.setSourceContent('../../coffee/foo.coffee', 'foo coffee');
  bundleMap.addMapping({
    generated: { line: 13, column: 13 },
    original: { line: 12, column: 12 },
    source: '/bar.coffee'
  });
  bundleMap.setSourceContent('/bar.coffee', 'bar coffee');
  bundleMap.addMapping({
    generated: { line: 23, column: 23 },
    original: { line: 22, column: 22 },
    source: 'http://www.example.com/baz.coffee'
  });
  bundleMap.setSourceContent(
    'http://www.example.com/baz.coffee',
    'baz coffee'
  );
  bundleMap = new SourceMapConsumer(bundleMap.toJSON());

  var minifiedMap = new SourceMapGenerator({
    file: 'bundle.min.js',
    sourceRoot: '..'
  });
  minifiedMap.addMapping({
    generated: { line: 1, column: 1 },
    original: { line: 3, column: 3 },
    source: 'temp/bundle.js'
  });
  minifiedMap.addMapping({
    generated: { line: 11, column: 11 },
    original: { line: 13, column: 13 },
    source: 'temp/bundle.js'
  });
  minifiedMap.addMapping({
    generated: { line: 21, column: 21 },
    original: { line: 23, column: 23 },
    source: 'temp/bundle.js'
  });
  minifiedMap = new SourceMapConsumer(minifiedMap.toJSON());

  var expectedMap = function (sources) {
    var map = new SourceMapGenerator({
      file: 'bundle.min.js',
      sourceRoot: '..'
    });
    map.addMapping({
      generated: { line: 1, column: 1 },
      original: { line: 2, column: 2 },
      source: sources[0]
    });
    map.setSourceContent(sources[0], 'foo coffee');
    map.addMapping({
      generated: { line: 11, column: 11 },
      original: { line: 12, column: 12 },
      source: sources[1]
    });
    map.setSourceContent(sources[1], 'bar coffee');
    map.addMapping({
      generated: { line: 21, column: 21 },
      original: { line: 22, column: 22 },
      source: sources[2]
    });
    map.setSourceContent(sources[2], 'baz coffee');
    return map.toJSON();
  }

  var actualMap = function (aSourceMapPath) {
    var map = SourceMapGenerator.fromSourceMap(minifiedMap);
    // Note that relying on `bundleMap.file` (which is simply 'bundle.js')
    // instead of supplying the second parameter wouldn't work here.
    map.applySourceMap(bundleMap, '../temp/bundle.js', aSourceMapPath);
    return map.toJSON();
  }

  util.assertEqualMaps(assert, actualMap('../temp/temp_maps'), expectedMap([
    'coffee/foo.coffee',
    '/bar.coffee',
    'http://www.example.com/baz.coffee'
  ]));

  util.assertEqualMaps(assert, actualMap('/app/temp/temp_maps'), expectedMap([
    '/app/coffee/foo.coffee',
    '/bar.coffee',
    'http://www.example.com/baz.coffee'
  ]));

  util.assertEqualMaps(assert, actualMap('http://foo.org/app/temp/temp_maps'), expectedMap([
    'http://foo.org/app/coffee/foo.coffee',
    'http://foo.org/bar.coffee',
    'http://www.example.com/baz.coffee'
  ]));

  // If the third parameter is omitted or set to the current working
  // directory we get incorrect source paths:

  util.assertEqualMaps(assert, actualMap(), expectedMap([
    '../coffee/foo.coffee',
    '/bar.coffee',
    'http://www.example.com/baz.coffee'
  ]));

  util.assertEqualMaps(assert, actualMap(''), expectedMap([
    '../coffee/foo.coffee',
    '/bar.coffee',
    'http://www.example.com/baz.coffee'
  ]));

  util.assertEqualMaps(assert, actualMap('.'), expectedMap([
    '../coffee/foo.coffee',
    '/bar.coffee',
    'http://www.example.com/baz.coffee'
  ]));

  util.assertEqualMaps(assert, actualMap('./'), expectedMap([
    '../coffee/foo.coffee',
    '/bar.coffee',
    'http://www.example.com/baz.coffee'
  ]));
};

exports['test applySourceMap name handling'] = function (assert) {
  // Imagine some CoffeeScript code being compiled into JavaScript and then
  // minified.

  var assertName = function(coffeeName, jsName, expectedName) {
    var minifiedMap = new SourceMapGenerator({
      file: 'test.js.min'
    });
    minifiedMap.addMapping({
      generated: { line: 1, column: 4 },
      original: { line: 1, column: 4 },
      source: 'test.js',
      name: jsName
    });

    var coffeeMap = new SourceMapGenerator({
      file: 'test.js'
    });
    coffeeMap.addMapping({
      generated: { line: 1, column: 4 },
      original: { line: 1, column: 0 },
      source: 'test.coffee',
      name: coffeeName
    });

    minifiedMap.applySourceMap(new SourceMapConsumer(coffeeMap.toJSON()));

    new SourceMapConsumer(minifiedMap.toJSON()).eachMapping(function(mapping) {
      assert.equal(mapping.name, expectedName);
    });
  };

  // `foo = 1` -> `var foo = 1;` -> `var a=1`
  // CoffeeScript doesn’t rename variables, so there’s no need for it to
  // provide names in its source maps. Minifiers do rename variables and
  // therefore do provide names in their source maps. So that name should be
  // retained if the original map lacks names.
  assertName(null, 'foo', 'foo');

  // `foo = 1` -> `var coffee$foo = 1;` -> `var a=1`
  // Imagine that CoffeeScript prefixed all variables with `coffee$`. Even
  // though the minifier then also provides a name, the original name is
  // what corresponds to the source.
  assertName('foo', 'coffee$foo', 'foo');

  // `foo = 1` -> `var coffee$foo = 1;` -> `var coffee$foo=1`
  // Minifiers can turn off variable mangling. Then there’s no need to
  // provide names in the source map, but the names from the original map are
  // still needed.
  assertName('foo', null, 'foo');

  // `foo = 1` -> `var foo = 1;` -> `var foo=1`
  // No renaming at all.
  assertName(null, null, null);
};

exports['test sorting with duplicate generated mappings'] = function (assert) {
  var map = new SourceMapGenerator({
    file: 'test.js'
  });
  map.addMapping({
    generated: { line: 3, column: 0 },
    original: { line: 2, column: 0 },
    source: 'a.js'
  });
  map.addMapping({
    generated: { line: 2, column: 0 }
  });
  map.addMapping({
    generated: { line: 2, column: 0 }
  });
  map.addMapping({
    generated: { line: 1, column: 0 },
    original: { line: 1, column: 0 },
    source: 'a.js'
  });

  util.assertEqualMaps(assert, map.toJSON(), {
    version: 3,
    file: 'test.js',
    sources: ['a.js'],
    names: [],
    mappings: 'AAAA;A;AACA'
  });
};

exports['test ignore duplicate mappings.'] = function (assert) {
  var init = { file: 'min.js', sourceRoot: '/the/root' };
  var map1, map2;

  // null original source location
  var nullMapping1 = {
    generated: { line: 1, column: 0 }
  };
  var nullMapping2 = {
    generated: { line: 2, column: 2 }
  };

  map1 = new SourceMapGenerator(init);
  map2 = new SourceMapGenerator(init);

  map1.addMapping(nullMapping1);
  map1.addMapping(nullMapping1);

  map2.addMapping(nullMapping1);

  util.assertEqualMaps(assert, map1.toJSON(), map2.toJSON());

  map1.addMapping(nullMapping2);
  map1.addMapping(nullMapping1);

  map2.addMapping(nullMapping2);

  util.assertEqualMaps(assert, map1.toJSON(), map2.toJSON());

  // original source location
  var srcMapping1 = {
    generated: { line: 1, column: 0 },
    original: { line: 11, column: 0 },
    source: 'srcMapping1.js'
  };
  var srcMapping2 = {
    generated: { line: 2, column: 2 },
    original: { line: 11, column: 0 },
    source: 'srcMapping2.js'
  };

  map1 = new SourceMapGenerator(init);
  map2 = new SourceMapGenerator(init);

  map1.addMapping(srcMapping1);
  map1.addMapping(srcMapping1);

  map2.addMapping(srcMapping1);

  util.assertEqualMaps(assert, map1.toJSON(), map2.toJSON());

  map1.addMapping(srcMapping2);
  map1.addMapping(srcMapping1);

  map2.addMapping(srcMapping2);

  util.assertEqualMaps(assert, map1.toJSON(), map2.toJSON());

  // full original source and name information
  var fullMapping1 = {
    generated: { line: 1, column: 0 },
    original: { line: 11, column: 0 },
    source: 'fullMapping1.js',
    name: 'fullMapping1'
  };
  var fullMapping2 = {
    generated: { line: 2, column: 2 },
    original: { line: 11, column: 0 },
    source: 'fullMapping2.js',
    name: 'fullMapping2'
  };

  map1 = new SourceMapGenerator(init);
  map2 = new SourceMapGenerator(init);

  map1.addMapping(fullMapping1);
  map1.addMapping(fullMapping1);

  map2.addMapping(fullMapping1);

  util.assertEqualMaps(assert, map1.toJSON(), map2.toJSON());

  map1.addMapping(fullMapping2);
  map1.addMapping(fullMapping1);

  map2.addMapping(fullMapping2);

  util.assertEqualMaps(assert, map1.toJSON(), map2.toJSON());
};

exports['test github issue #72, check for duplicate names or sources'] = function (assert) {
  var map = new SourceMapGenerator({
    file: 'test.js'
  });
  map.addMapping({
    generated: { line: 1, column: 1 },
    original: { line: 2, column: 2 },
    source: 'a.js',
    name: 'foo'
  });
  map.addMapping({
    generated: { line: 3, column: 3 },
    original: { line: 4, column: 4 },
    source: 'a.js',
    name: 'foo'
  });
  util.assertEqualMaps(assert, map.toJSON(), {
    version: 3,
    file: 'test.js',
    sources: ['a.js'],
    names: ['foo'],
    mappings: 'CACEA;;GAEEA'
  });
};

exports['test setting sourcesContent to null when already null'] = function (assert) {
  var smg = new SourceMapGenerator({ file: "foo.js" });
  assert.doesNotThrow(function() {
    smg.setSourceContent("bar.js", null);
  });
};

exports['test applySourceMap with unexact match'] = function (assert) {
  var map1 = new SourceMapGenerator({
    file: 'bundled-source'
  });
  map1.addMapping({
    generated: { line: 1, column: 4 },
    original: { line: 1, column: 4 },
    source: 'transformed-source'
  });
  map1.addMapping({
    generated: { line: 2, column: 4 },
    original: { line: 2, column: 4 },
    source: 'transformed-source'
  });

  var map2 = new SourceMapGenerator({
    file: 'transformed-source'
  });
  map2.addMapping({
    generated: { line: 2, column: 0 },
    original: { line: 1, column: 0 },
    source: 'original-source'
  });

  var expectedMap = new SourceMapGenerator({
    file: 'bundled-source'
  });
  expectedMap.addMapping({
    generated: { line: 1, column: 4 },
    original: { line: 1, column: 4 },
    source: 'transformed-source'
  });
  expectedMap.addMapping({
    generated: { line: 2, column: 4 },
    original: { line: 1, column: 0 },
    source: 'original-source'
  });

  map1.applySourceMap(new SourceMapConsumer(map2.toJSON()));

  util.assertEqualMaps(assert, map1.toJSON(), expectedMap.toJSON());
};

exports['test issue #192'] = function (assert) {
  var generator = new SourceMapGenerator();
  generator.addMapping({
    source: 'a.js',
    generated: { line: 1, column: 10 },
    original: { line: 1, column: 10 },
  });
  generator.addMapping({
    source: 'b.js',
    generated: { line: 1, column: 10 },
    original: { line: 2, column: 20 },
  });

  var consumer = new SourceMapConsumer(generator.toJSON());

  var n = 0;
  consumer.eachMapping(function () { n++ });

  assert.equal(n, 2,
               "Should not de-duplicate mappings that have the same " +
               "generated positions, but different original positions.");
};

exports['test numeric names #231'] = function (assert) {
  var generator = new SourceMapGenerator();
  generator.addMapping({
    source: 'a.js',
    generated: { line: 1, column: 10 },
    original: { line: 1, column: 10 },
    name: 8
  });
  var map = generator.toJSON();
  assert.ok(map, "Adding a mapping with a numeric name did not throw");
  assert.equal(map.names.length, 1, "Should have one name");
  assert.equal(map.names[0], "8", "Should have the right name");
};
