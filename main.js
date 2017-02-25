
function HandwriteInput(bounds) {
  this.stream = [];
  this.bounds = bounds;
  this.prev = null;

  // initialize stream
  for (var i = 0; i < bounds.width; i++) {
    this.stream.push(50);
  }
}

HandwriteInput.prototype.handleMouseMove = function(x, y, buttons) {
  if (x < this.bounds.x || this.bounds.x + this.bounds.width < x ||
      y < this.bounds.y || this.bounds.y + this.bounds.height < y) {
    return;
  }

  if (buttons) {
    var current = { x: x - this.bounds.x, y: y - this.bounds.y };
    this.updateStream(this.prev, current);
    this.prev = current;
  } else {
    this.prev = null;
  }
}

HandwriteInput.prototype.updateStream = function(prev, current) {
  if (prev) {
    // complement stream since cursor movement is not countinuous
    var i = prev.x;
    while (i != current.x) {
      this.stream[i] = prev.y + (current.y - prev.y) *
        ((i - prev.x) / (current.x - prev.x));
      i += (current.x > prev.x ? 1 : -1);
    }
  }
  this.stream[current.x] = current.y;
}

function matchStream(stream1, stream2) {
  var map = [];
  var cache = [];

  for (var i = 0; i < stream1.length; i++) {
    map.push([]);
    cache.push([]);
    for (var j = 0; j < stream2.length; j++) {
      map[i].push(Math.abs(stream1[i] - stream2[j]) + 1);
      cache[i].push(Math.abs(i - j) < 150 ? -1 : Number.MAX_VALUE);
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

function Renderer(canvas) {
  this.context = canvas.getContext('2d');
  this.width = canvas.width;
  this.height = canvas.height;
}

Renderer.prototype.clear = function() {
  this.context.clearRect(0, 0, this.width, this.height);
}

Renderer.prototype.renderStream = function(stream, bounds, label) {
  this.context.strokeStyle = 'gray';
  this.context.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height);
  this.context.beginPath();
  for (var i = 1; i < stream.length; i++) {
    this.context.moveTo(bounds.x + (i - 1), bounds.y + stream[i - 1]);
    this.context.lineTo(bounds.x + i, bounds.y + stream[i]);
  }
  this.context.stroke();

  if (label) {
    this.context.textBaseline = 'middle';
    this.context.fillText(
      label,
      bounds.x - 70,
      bounds.y + bounds.height / 2);
  }
}

Renderer.prototype.renderWarpingPath = function(warpingPath, bounds, label) {
  var margin = 3;
  this.context.strokeStyle = 'lightgray';
  this.context.beginPath();
  for (var i = 0; i < warpingPath.length; i++) {
    this.context.moveTo(bounds.x + warpingPath[i][0] * 10, bounds.y + margin);
    this.context.lineTo(bounds.x + warpingPath[i][1] * 10, bounds.y + bounds.height - margin);
  }
  this.context.stroke();

  if (label) {
    this.context.textBaseline = 'middle';
    this.context.fillText(
      label,
      bounds.x - 80,
      bounds.y + bounds.height / 2);
  }
}

function update(renderer, stream1, stream2) {
  renderer.clear();
  renderer.renderStream(stream1, { x: 100, y: 10, width: 400, height: 100 }, 'stream (x)');
  renderer.renderStream(stream2, { x: 100, y: 210, width: 400, height: 100 }, 'stream (y)');
  var w = matchStream(mabi(stream1), mabi(stream2));
  renderer.renderWarpingPath(w, { x: 100, y: 110, width: 400, height: 100 }, 'warping path (w)');
}

function init() {
  var canvas = document.getElementsByClassName('dtw-handwrite-input')[0];
  var stream1 = [0];
  var stream2 = [0];

  var renderer = new Renderer(canvas);
  var input1 = new HandwriteInput({ x: 100, y: 10, width: 400, height: 100 });
  var input2 = new HandwriteInput({ x: 100, y: 210, width: 400, height: 100 });

  canvas.addEventListener('mousemove', function(e) {
    input1.handleMouseMove(e.offsetX, e.offsetY, e.buttons);
    input2.handleMouseMove(e.offsetX, e.offsetY, e.buttons);
    update(renderer, input1.stream, input2.stream);
  });
}

document.addEventListener('DOMContentLoaded', init);
