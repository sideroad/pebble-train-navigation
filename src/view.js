var UI = require('ui');
var Vector2 = require('vector2');
var JaText = require('jatext');
var Settings = require('settings');
var data;

var main = new UI.Window({
  scrollable: false,
  backgroundColor: 'white'
});
var last = new UI.Window({
  scrollable: false,
  backgroundColor: 'white'
});
var error = new UI.Card({
  title: 'Data does not exists'
});
var nowLoading = new UI.Window({
  scrollable: false,
  backgroundColor: 'white'
});
var select = new UI.Window({
  scrollable: false
});

var View = function(_data){
  data = _data;
  this.main.init();
  this.last.init();
  this.select.init();
  this.nowLoading.init();
  this.error.init();
  return this;
};
var getHms = function(time){
  var hour= Math.floor( Math.abs(time) / 3600 ),
      min = Math.floor( Math.abs(time) / 60 ) % 60,
      sec = Math.floor( Math.abs( time ) % 60 );
  return (time >= 0 ? '' : '-') +
         (hour ? hour + 'h ' + min + 'm' : 
          min  ? min  + 'm ' + sec + 's' : sec + 's');
};
var winds = {
  main: main,
  last: last,
  error: error,
  nowLoading: nowLoading,
  select: select
};
View.prototype = {

  show: function(target){
    Object.keys(winds).forEach(function(wind){
      if(wind != target){
        winds[wind].hide();
      }
    });
    winds[target].show();
    this.displayed = target;
  },
  last: {
    background: {
      rect: new UI.Rect({
        position: new Vector2(0, 0),
        size: new Vector2(144, 168),
        borderColor: 'black',
        backgroundColor : 'black'
      })
    },
    separate: {
      rect: new UI.Rect({
        position: new Vector2(0, 59),
        size: new Vector2(144, 2),
        borderColor: 'white',
        backgroundColor: 'white'
      })
    },
    from:{
      text: new JaText({
        position: new Vector2(0, 0),
        size: new Vector2(144, 24),
        color: 'white',
        backgroundColor : 'black'
      }),
      update: function(){
        this.text.text(data.from);
      }
    },
    leave: {
      text: new UI.Text({
        position: new Vector2(0, 24),
        size: new Vector2(144, 30),
        font: 'gothic-28-bold',
        color: 'white',
        backgroundColor : 'black'
      }),
      update: function(){
        var hms = getHms(data.last.ride - data.walk);
        this.text.text('Leav: '+ hms);
      }
    },
    displayed: '',
    route: {
      text: new UI.Text({
        position: new Vector2(0, 61),
        size: new Vector2(144, 70),
        font: 'gothic-28-bold',
        textAlign: 'center',
        color: 'white',
        backgroundColor : 'black'
      }),
      update: function(){
        var hms = getHms(data.last.ride);
        var route = data.last.route || {departure: '', arrival: ''};
        this.text.text('Ride: '+ hms + '\n'+
                       route.departure + ' -> ' + route.arrival);
      }
    },
    to:{
      text: new JaText({
        position: new Vector2(0, 128),
        size: new Vector2(144, 24),
        color: 'white',
        backgroundColor : 'black',
        borderColor : 'black'
      }),
      update: function(){
        this.text.text(data.to);
      }
    },
    init: function(){
      // Arranging parts
      last.add(this.background.rect);
      last.add(this.from.text);
      last.add(this.leave.text);
      last.add(this.separate.rect);
      last.add(this.route.text);
      last.add(this.to.text); 
    },
    update: function(){
      this.from.update();
      this.to.update();
      this.leave.update();
      this.route.update();
    }
  },
  main: {
    background: {
      rect: new UI.Rect({
        position: new Vector2(0, 0),
        size: new Vector2(144, 168),
        borderColor: 'white',
        backgroundColor : 'white'
      })
    },
    separate: {
      rect: new UI.Rect({
        position: new Vector2(0, 59),
        size: new Vector2(144, 2),
        borderColor: 'black',
        backgroundColor: 'black'
      })
    },
    from:{
      text: new JaText({
        position: new Vector2(0, 0),
        size: new Vector2(144, 24),
        color: 'white',
        backgroundColor : 'black',
        borderColor : 'black'
      }),
      update: function(){
        this.text.text(data.from);
      }
    },
    leave: {
      text: new UI.Text({
        position: new Vector2(0, 24),
        size: new Vector2(144, 30),
        font: 'gothic-28-bold',
        color: 'black',
        backgroundColor : 'white'
      }),
      update: function(){
        var hms = getHms(data.ride[data.page] - data.walk);
        this.text.text('Leav: '+ hms);
      }
    },
    route: {
      text: new UI.Text({
        position: new Vector2(0, 61),
        size: new Vector2(144, 70),
        font: 'gothic-28-bold',
        textAlign: 'center',
        color: 'black',
        backgroundColor : 'white'
      }),
      update: function(){
        var page = data.page;
        var hms = getHms(data.ride[page]);
        var route = data.routes[page] || {departure: '', arrival: ''};
        this.text.text('Ride: '+ hms + '\n'+
                       route.departure + ' -> ' + route.arrival);
      }
    },
    to:{
      text: new JaText({
        position: new Vector2(0, 128),
        size: new Vector2(144, 24),
        color: 'white',
        backgroundColor : 'black',
        borderColor : 'black'
      }),
      update: function(){
        this.text.text(data.to);
      }
    },
    init: function(){
      // Arranging parts
      main.add(this.background.rect);
      main.add(this.from.text);
      main.add(this.leave.text);
      main.add(this.separate.rect);
      main.add(this.route.text);
      main.add(this.to.text);
       
    },
    update: function(){
      this.from.update();
      this.to.update();
      this.leave.update();
      this.route.update();
    },
    slide: function(direct){
      var that = this;
      
      ['leave', 'route'].forEach(function(target){
        var text = that[target].text;
        var pos = text.position();
        var size = text.size();
        pos.x = (direct==='next'? 1 : -1) * 144;
        text.position(pos);
        that[target].update();
        pos.x = 0;
        text.animate({position: pos,size: size}, 200);
      });
    }
  },
  error: {
    init: function(){}
  },
  nowLoading:{
    init: function(){
      var loadingBack = new UI.Rect({
        position: new Vector2(0, 0),
        size: new Vector2(144, 168),
        backgroundColor : 'white'
      });
      var loadingText = new UI.Text({
        position: new Vector2(0, 60),
        size: new Vector2(144, 30),
        color: 'black',
        font: 'gothic-28-bold',
        backgroundColor : 'white',
        text: 'Now loading...'
      });
      
      nowLoading.add(loadingBack);
      nowLoading.add(loadingText);
    }
  },
  select: {
    init: function(){
      select.to = new JaText({
        position: new Vector2(0,60),
        size: new Vector2(144, 24),
        color: 'white',
        backgroundColor: 'black'
      });
      select.add(select.to);
      
      select.on('click', 'down', function(){
      console.log(data.stations);
      if(!data.stations){
        return;
      }
      if(data.select.page < data.stations.length -1){
        data.select.page++;
      }
      data.select.to = data.stations[data.select.page];
      select.to.text(data.select.to);
    });
    select.on('click', 'up', function(){
      console.log(data.stations);
      if(data.select.page !== 0){
        data.select.page--;
      }
      data.select.to = data.stations[data.select.page];
      select.to.text(data.select.to);
    });
    select.on('click', 'select', function(){
      data.to = data.select.to;
      Settings.data('to', data.to);
      show('nowLoading');
    });
    select.on('click', 'back', function(){
      show('main');
    });
    }
  },
  wind: winds
};
var show = View.prototype.show;



module.exports = View;