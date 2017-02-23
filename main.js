
function setupHandwriteArea(canvas, x, y, width, height, callback) {
  var context = canvas.getContext('2d');
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

  var drawStream = function() {
    context.clearRect(x, y, width + 1, height + 1);
    context.strokeRect(x, y, width, height);
    context.strokeStyle = 'black';
    context.beginPath();
    for (var i = 1; i < stream.length; i++) {
      context.moveTo(x + (i - 1), y + stream[i - 1]);
      context.lineTo(x + i, y + stream[i]);
    }
    context.stroke();
  }

  var handleMouseMove = function(e) {
    if (e.offsetX < x || x + width < e.offsetX ||
        e.offsetY < y || y + height < e.offsetY) {
      return;
    }

    if (e.buttons) {
      var current = { x: e.offsetX - x, y: e.offsetY - y };
      updateStream(prev, current);
      drawStream();
      prev = current;
      callback(stream);
    } else {
      prev = null;
    }
  }

  drawStream();

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

function updateMatch(canvas, stream1, stream2) {
  var match = matchStream(mabi(stream1), mabi(stream2));
  var context = canvas.getContext('2d');

  context.clearRect(10, 110 + 1, 400, 100 - 1);
  context.beginPath();
  for (var i = 0; i < match.length; i++) {
    context.moveTo(10 + match[i][0] * 10, 110);
    context.lineTo(10 + match[i][1] * 10, 210);
  }
  context.stroke();
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

function init() {
  var canvas = document.getElementsByClassName('dtw-handwrite-input')[0];
  var stream1 = [0];
  var stream2 = [0];

  setupHandwriteArea(canvas, 10, 10, 400, 100, function(s) {
    stream1 = s;
    updateMatch(canvas, stream1, stream2);
  });

  setupHandwriteArea(canvas, 10, 210, 400, 100, function(s) {
    stream2 = s
    updateMatch(canvas, stream1, stream2);
  });
}

document.addEventListener('DOMContentLoaded', init);
