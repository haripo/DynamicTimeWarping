
function setupHandwriteArea(canvas, x, y, width, height, callback) {
  var prev = null;
  var stream = [];

  for (var i = 0; i < width; i++) {
    stream.push(height / 2);
  }

  var updateStream = function(prev, current) {
    if (prev) {
      // complement stream since cursor movement is not countinuous
      var i = prev.x;
      while (i != current.x) {
        stream[i] = prev.y + (current.y - prev.y) *
          ((i - prev.x) / (current.x - prev.x));
        i += (current.x > prev.x ? 1 : -1);
      }
    }
    stream[current.x] = current.y;
  }

  var handleMouseMove = function(e) {
    if (e.offsetX < x || x + width < e.offsetX ||
        e.offsetY < y || y + height < e.offsetY) {
      return;
    }

    if (e.buttons) {
      var current = { x: e.offsetX - x, y: e.offsetY - y };
      updateStream(prev, current);
      prev = current;
      callback(stream);
    } else {
      prev = null;
    }
  }

  canvas.addEventListener('mousemove', handleMouseMove);
}

function matchStream(stream1, stream2) {
  var map = [];
  var cache = [];

  for (var i = 0; i < stream1.length; i++) {
    map.push([]);
    cache.push([]);
    for (var j = 0; j < stream2.length; j++) {
      map[i].push(Math.abs(stream1[i] - stream2[j]) + 1);
      cache[i].push(Math.abs(i - j) < 15 ? -1 : Number.MAX_VALUE);
    }
  }
  cache[0][0] = 1;

  var search = null;
  search = function(x, y) {
    if (cache[x][y] <= 0) {
      cache[x][y] = map[x][y] + Math.min(
        (x > 0 ? search(x - 1, y) : Number.MAX_VALUE),
        (y > 0 ? search(x, y - 1) : Number.MAX_VALUE),
        (x > 0 && y > 0 ? search(x - 1, y - 1) : Number.MAX_VALUE)
      );
    }
    return cache[x][y];
  };

  search(stream1.length - 1, stream2.length - 1);

  var x = 0;
  var y = 0;
  var match = [];
  while (x != stream1.length - 1 || y > stream2.length - 1) {
    if (cache[x + 1][y + 1] <= cache[x + 1][y] &&
        cache[x + 1][y + 1] <= cache[x][y + 1]) {
      x += 1;
      y += 1;
    } else if (cache[x][y + 1] <= cache[x + 1][y]) {
      y += 1;
    } else {
      x += 1;
    }
    match.push([x, y])
  }

  return match;
}

function mabi(s) {
  var r = [];
  for (var i = 0; i < s.length; i++) {
    if (i % 10 == 0) {
      r.push(s[i]);
    }
  }
  return r;
}

function Renderer(context) {
  this.context = context;
}

Renderer.prototype.renderStream = function(stream, bounds) {
  this.context.clearRect(bounds.x, bounds.y, bounds.width, bounds.height);
  this.context.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height);
  this.context.strokeStyle = 'black';
  this.context.beginPath();
  for (var i = 1; i < stream.length; i++) {
    this.context.moveTo(bounds.x + (i - 1), bounds.y + stream[i - 1]);
    this.context.lineTo(bounds.x + i, bounds.y + stream[i]);
  }
  this.context.stroke();
}

Renderer.prototype.renderWarpingPath = function(warpingPath, bounds) {
  this.context.clearRect(bounds.x, bounds.y, bounds.width, bounds.height);
  this.context.beginPath();
  for (var i = 0; i < warpingPath.length; i++) {
    this.context.moveTo(bounds.x + warpingPath[i][0] * 10, bounds.y);
    this.context.lineTo(bounds.x + warpingPath[i][1] * 10, bounds.y + bounds.height);
  }
  this.context.stroke();
}

function update(renderer, stream1, stream2) {
  renderer.renderStream(stream1, { x: 10, y: 10, width: 400, height: 100 });
  renderer.renderStream(stream2, { x: 10, y: 210, width: 400, height: 100 });
  var w = matchStream(mabi(stream1), mabi(stream2));
  renderer.renderWarpingPath(w, { x: 10, y: 110, width: 400, height: 100 });
}

function init() {
  var canvas = document.getElementsByClassName('dtw-handwrite-input')[0];
  var stream1 = [0];
  var stream2 = [0];
  var context = canvas.getContext('2d');
  var renderer = new Renderer(context);

  setupHandwriteArea(canvas, 10, 10, 400, 100, function(s) {
    stream1 = s;
    update(renderer, stream1, stream2);
  });

  setupHandwriteArea(canvas, 10, 210, 400, 100, function(s) {
    stream2 = s
    update(renderer, stream1, stream2);
  });
}

document.addEventListener('DOMContentLoaded', init);
