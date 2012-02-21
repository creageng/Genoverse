CBrowse.Track = Base.extend({
  defaults: {
    height: 10
  },
  
  constructor: function (config) {
    var track = this;
    
    $.extend(this, this.defaults, config);
    
    this.canvas        = $('<canvas>').appendTo(this.canvasContainer);
    this.container     = $('<div class="track_container">').css({ height: this.height }).appendTo(this.canvasContainer),
    this.imgContainer  = $('<div class="image_container">');
    this.context       = this.canvas[0].getContext('2d');
    this.fontHeight    = parseInt(this.context.font, 10);
    this.fontWidth     = this.context.measureText('W').width;
    this.featureHeight = this.featureHeight || this.height;
    this.fullHeight    = this.height;
    this.initialHeight = this.height;
    this.zoomSettings  = {};
    this.features      = new RTree();
    
    this.setScale();
    
    this.container.on('click', 'img', function (e) {
      var x        = e.pageX - track.container.parent().offset().left + track.cBrowse.scaledStart;
      var y        = e.pageY - track.container.offset().top;
      var features = track.rtree.search({ x: x, y: y, w: 1, h: 1 });
      var i        = features.length;
      var seen     = {};
      
      while (i--) {
        if (seen[features[i].id]) {
          continue;
        }
        
        seen[features[i].id] = 1;
        
        track.cBrowse.makeMenu(features[i], { left: e.pageX, top: e.pageY }, track.name);
      }
    });
  },
  
  reset: function () {
    this.zoomSettings = {};
    this.features     = new RTree();
    
    this.container.empty();
  },
  
  makeImage: function (start, end, width, moved) {
    var func = moved < 0 ? 'unshift' : 'push';
    var pos  = moved < 0 ? 'right'   : 'left';
    var div  = this.imgContainer.clone().width(width);
    
    var img = new CBrowse.TrackImage({
      track      : this,
      container  : div,
      start      : start, 
      end        : end,
      width      : width,
      edges      : { start: start * this.scale, end: end * this.scale },
      func       : func,
      labelScale : Math.ceil(this.fontWidth / this.scale),
      background : this.cBrowse.colors.background
    });
    
    this.imgContainers[func](div[0]);
    this.container.append(this.imgContainers);
    
    div.css(pos, this.offsets[pos]);
    
    this.offsets[pos] += width;
    
    return img.getData();
  },
  
  addOverlaps: function (data) {
    data = this.overlaps.concat(data);
    this.overlaps = [];
    return data;
  },
  
  setScale: function () {
    var track = this;
    var zoom  = this.cBrowse.zoom;
    
    this.scale = this.cBrowse.scale;
    
    if (this.zoomSettings[zoom] && !this.cBrowse.history[this.cBrowse.start + ':' + this.cBrowse.end]) {
      this.container.children('.zoom_' + zoom.toString().replace('.', '_')).remove();
      delete this.zoomSettings[zoom];
    }
    
    if (!this.zoomSettings[zoom]) {
      this.zoomSettings[zoom] = {
        offsets       : { right: this.width, left: -this.width },
        rtree         : new RTree(),
        imgContainers : [],
        overlaps      : []
      };
    }
    
    var zoomSettings = this.zoomSettings[zoom];
    
    $.each([ 'offsets', 'rtree', 'imgContainers', 'overlaps' ], function () {
      track[this] = zoomSettings[this];
    });
    
    this.container.css('left', 0).children().hide();
  },
  
  setFeatures: function (data) {
    var i = data.length;
    
    while (i--) {
      this.features.insert({ x: data[i].start, y: 0, w: data[i].end - data[i].start, h: 1 }, data[i]);
    }
  },
  
  positionData: $.noop // implement in children
});