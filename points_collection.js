///////////////////////////////////////////////////////////////////////////////
// Utils

Array.prototype.min = function(func) {
  var element;

  if(this.length > 0) {
    element = this[0];
    var min_value = func(element);

    for(var i = 0; i < this.length; i++) {
      if(func(this[i]) < min_value) {
        element = this[i];
        min_value = func(this[i]);
      }
    }
  } 

  return element;
}

Array.prototype.max = function(func) {
  return this.min(function(element) {
    return -func(element);
  });
}

var profile_function = function(func, description) {
  console.log(">>>> " + description);
  var before = new Date().getTime();
  func();
  var after = new Date().getTime();

  console.log("<<<< " + description + ": " + (after - before) / 1000 + " ms");
}



///////////////////////////////////////////////////////////////////////////////
// Point
var points_sequence = 0;
var Point = function(x, y) {
  points_sequence++;
  this.x = x;
  this.y = y;
}

Point.prototype.distance_to = function(point) {
  return Math.pow(Math.pow(parseFloat(this.x-point.x), 2) + Math.pow(parseFloat(this.y-point.y), 2), 0.5);
}

///////////////////////////////////////////////////////////////////////////////
// PointsMap

var PointsMap = function(options) {
  this.M = options.M;
  this.N = options.N;
  this.min_x = options.min_x;
  this.max_x = options.max_x;
  this.min_y = options.min_y;
  this.max_y = options.max_y;

  this.data = {};

  for(var m = 0; m < this.M; m++) {
    this.data[m] = {};

    for(var n = 0; n < this.N; n++) {
      this.data[m][n] = new PointsCollection();
    }
  }
}

PointsMap.prototype.indexOf = function(point) {
  var delta_x = (this.max_x - this.min_x) / this.M;
  var delta_y = (this.max_y - this.min_y) / this.N;
  var m = Math.floor((point.x - this.min_x) / delta_x);
  var n = Math.floor((point.y - this.min_y) / delta_y); 

  m = Math.max(0, Math.min(m, this.M - 1));
  n = Math.max(0, Math.min(n, this.N - 1));

  return { m: m, n: n };
}

PointsMap.prototype.push = function(point) {
  var index = this.indexOf(point);
  this.data[index.m][index.n].push(point);
}

PointsMap.prototype.get_chunk = function(index) {
  if(this.data[index.m] != undefined) {
    return this.data[index.m][index.n];
  }
}

///////////////////////////////////////////////////////////////////////////////
// PointsCollection
PointsCollection = function() {}
PointsCollection.prototype = Array.prototype;

PointsCollection.prototype.find_closest_to = function(point) {
  return this.min(function(a) { return a.distance_to(point) });
}

PointsCollection.prototype.prepare_map = function(N) {
  var min_x = this.min(function(el){ return el.x }).x;
  var max_x = this.max(function(el){ return el.x }).x;
  
  var min_y = this.min(function(el){ return el.y }).y;
  var max_y = this.max(function(el){ return el.y }).y;

  this.points_map = new PointsMap({min_x: min_x, max_x: max_x, min_y: min_y, max_y: max_y, M: N, N: N});

  for(var i = 0; i < this.length; i++) {
    this.points_map.push(this[i]);
  }
}

// Счиатется, что точка должны быть внутри одного из chunk'ов
PointsCollection.prototype.smart_find_closest_to = function(point) {
  var closest;
  var radius = 0;
  var first_chunk_index = this.points_map.indexOf(point);

  while(closest == undefined) {
    var chunks_indexes = [];

    if(radius == 0) {
      chunks_indexes.push(first_chunk_index);
    } else {
      for(var m = first_chunk_index.m - radius; m <= first_chunk_index.m + radius; m++) {
        chunks_indexes.push({ m: m, n: first_chunk_index.n - radius });
        chunks_indexes.push({ m: m, n: first_chunk_index.n + radius });
      }

      for(var n = first_chunk_index.n - radius + 1; n <= first_chunk_index.n + radius - 1; n++) {
        chunks_indexes.push({ m: first_chunk_index.m - radius, n: n });
        chunks_indexes.push({ m: first_chunk_index.m + radius, n: n });
      }
    }

    var collection = new PointsCollection();
    // из каждого куска карты выбираем ближнюю точку
    for(var i = 0; i < chunks_indexes.length; i++) {
      var chunk = this.points_map.get_chunk(chunks_indexes[i]);

      if(chunk != undefined) {
        var closest = chunk.find_closest_to(point);
        if(closest != undefined) collection.push(closest);
      }
    }

    closest = collection.find_closest_to(point);

    // расширяем круг поиска
    radius++;
  }

  return closest;
}

///////////////////////////////////////////////////////////////////////////////
// Program

var collection = new PointsCollection();


//random data
for(var i = 0; i < 100; i++) {
  collection.push(new Point(Math.random(), Math.random()));
}

profile_function(function() {
  collection.prepare_map(100);
}, "Prepare map");

//profile_function(function() {
  //for(var i = 0; i < collection.length / 2; i++) {
    //collection.smart_find_closest_to(new Point(Math.random(), Math.random()));
  //}
//}, "Smart search");


for(var i=0; i < 100; i++) {
  var point = new Point(Math.random(), Math.random());
  var closest1 = collection.find_closest_to(point);
  var closest2 = collection.smart_find_closest_to(point);

  if(closest1.x != closest2.x) {
    console.log(closest1, point.distance_to(closest1));
    console.log(closest2, point.distance_to(closest2));
  }
}
