/**
 * Welcome to Pebble.js!
 *
 * This is where you write your app.
 */
// Initialize data
var Settings = require('settings');
var Accel = require('ui/accel');
Accel.init();
var data = {
  coords: {
    lat: 0,
    lng: 0
  },
  from: Settings.data('from')||'',
  to: Settings.data('to')||'',
  roundtrip: Settings.option('roundtrip')||[
    '東京',
      '渋谷'
  ],
  stations: Settings.option('stations')||[
    '東京',
    '渋谷',
      '新宿'
  ],
  select: {
    to: '',
    page:0
  },
  vibe: {
    before: (Settings.option('vibe')||{before:3}).before,
    from: (Settings.option('vibe')||{from:'00:00'}).from,
    to: (Settings.option('vibe')||{to:'21:00'}).to,
    last: (Settings.option('vibe')||{before:15}).last
  },
  walk: 0,
  departureDate: [],
  ride: [],
  routes: [],
  page: 0,
  latest: '',
  id: '',
  last: {
    ride: 0
  }
};
var getTo = function(){
  return data.roundtrip.filter(function(station){
    return station != data.from;
  })[0];
};
data.to = data.to || getTo();
Settings.data('to', data.to);

Settings.config(
  { url: 'http://train-route.herokuapp.com/config.html' },
  function(e) {
    console.log('closed configurable');

    data.stations = e.options.station;
    data.roundtrip = e.options.roundtrip;
    data.vibe = e.options.vibe;
    data.to = getTo();
    updateRoute();
  }
);


var ajax = require('ajax');
var View = require('view');
var tick = require('tick');

// Initialize view
var view = new View(data);
view.show('nowLoading');
var getDepartureDate = function(departureTime){
    var departure = new Date(),
        now = new Date();
  departure.setHours(departureTime.split(':')[0]);
  departure.setMinutes(departureTime.split(':')[1]);
  departure.setSeconds(0);
  now.setSeconds(0);

  // To prevent bug after 00:00 AM
  if( departure < now ){
    departure.setTime(departure.getTime()+86400000);
  }
  return departure;
};
var getRideTime = function(departureTime){
  var departure = getDepartureDate(departureTime),
      now = new Date();
  return ( departure - now ) / 1000;
};

var isNowLoading = false;
var updateRoute = function(calls, page){
  
  if(!data.from || isNowLoading) {
    return;
  }
  if(data.to === data.from){
    data.to = getTo();
    Settings.data('to', data.to);
    
  }
  var next = new Date(),
      url;
  
  url = 'http://train-route.herokuapp.com/route/'+
      encodeURIComponent(data.from)+'/'+
      encodeURIComponent(data.to)+'/'+
      (next.getFullYear())+
      ('0'+(next.getMonth()+1)).slice(-2)+
      ('0'+(next.getDate())).slice(-2)+'/'+
      ('0'+(next.getHours())).slice(-2)+
      ('0'+(next.getMinutes())).slice(-2)+'/0/1/'+(calls||'1')+'/';
  console.log(url);
  isNowLoading = true;
  ajax({
    url: url,
    type: 'json'
  }, function(direction){
    isNowLoading = false;
    if(direction.routes[0].departure){
      data.routes = direction.routes;
      data.routes.forEach(function(route, i){
        data.departureDate[i] = getDepartureDate(route.departure||0);
        data.ride[i] = getRideTime(route.departure||0);
        console.log(data.ride[i]);
      });
      data.latest = data.routes[0].departure;
      data.page = page || data.routes.reduce(function(page, route, index){
        if(route.id === data.id){
          return index;
        }
        return page;
      }, 0);
      data.id = data.routes[data.page].id;
      console.log('Route lengh: '+direction.routes.length);
      view.show('main');
    } else {
      view.show('error');
    }
  }, function(err){
    isNowLoading = false;
    view.show('error');
  });
};

var updateLastTrain = function(){
    var next = new Date(),
      url;
  
  url = 'http://train-route.herokuapp.com/route/'+
      encodeURIComponent(data.from)+'/'+
      encodeURIComponent(data.to)+'/'+
      (next.getFullYear())+
      ('0'+(next.getMonth()+1)).slice(-2)+
      ('0'+(next.getDate())).slice(-2)+'/'+
      ('0'+(next.getHours())).slice(-2)+
      ('0'+(next.getMinutes())).slice(-2)+'/0/2/1/';
  console.log(url);
  isNowLoading = true;
  ajax({
    url: url,
    type: 'json'
  }, function(direction){
    isNowLoading = false;
    if(direction.routes[0].departure){
      var route = direction.routes[0];
      var ride;
      var departureDate;
      departureDate = getDepartureDate(route.departure||0);
      ride = getRideTime(route.departure||0);
      console.log(ride);
      data.last = {
        departureDate: departureDate,
        ride: ride,
        route: route
      };
      view.show('last');
    } else {
      view.show('error');
    }
  }, function(err){
    isNowLoading = false;
    view.show('error');
  });
};


var updateLocation = function(){
    console.log(data.coords.lat, data.coords.lng);
    
    var url= 'http://train-route.herokuapp.com/nearest/'+data.coords.lat+'/'+data.coords.lng+'/';
  console.log(url);
    ajax({
      url: url,
          type: 'json'
    }, function(place){
      console.log(place.name);
      data.from = place.name.replace(/駅$/, '');
      data.walk = place.duration;
      Settings.data('from', data.from);
    }, function(){
      view.show('error');
    });
};

var consecutive = 0;

tick(function(){
  navigator.geolocation.getCurrentPosition(function(pos){
    var coords = pos.coords;
    coords.lat = coords.latitude.toFixed(4);
    coords.lng = coords.longitude.toFixed(4);
    if(Number(coords.lat).toFixed(3) === Number(data.coords.lat).toFixed(3) &&
       Number(coords.lng).toFixed(3) === Number(data.coords.lng).toFixed(3) ){
      consecutive = 0;
      return;
    }
    // Human can't walk 111m / 5sec
    // Two consecutive coords changing is seems to ride vehicle
    if(consecutive > 2){
      return;
    }
    consecutive++;
    data.coords = coords;
    updateLocation();
  });
}, 30000);

var prev;
tick(function(){
  
  if(view.displayed === 'last'){
    // Route information should be updated when ride time have past
    if(data.last.ride - (data.walk / data.limit) < 0){
      updateLastTrain();
    }
    if(data.to != prev){
      prev = data.to;
      updateLastTrain();
    }
  } else {
    // Route information should be updated when ride time have past
    data.ride.forEach(function(time){
      if(time - (data.walk / data.limit) < 0){
        updateRoute();
      }
    });
    if(data.to != prev){
      prev = data.to;
      updateRoute();
    }    
  }
}, 3000);

var Vibe = require('ui/vibe');
var vibed = '';
var vibefrom = new Date();
var vibeto = new Date();
vibefrom.setHours(data.vibe.from.split(':')[0]);
vibefrom.setMinutes(data.vibe.from.split(':')[1]);
vibeto.setHours(data.vibe.to.split(':')[0]);
vibeto.setMinutes(data.vibe.to.split(':')[1]);

tick(function(){
  data.routes.forEach(function(route, i){
    data.ride[i]--;
  });
  data.last.ride--;
  var now = new Date();
  var vibetime;

  if(view.displayed === 'main'){
    vibetime = data.ride[0] - data.walk - (data.vibe.before * 60);  
    if(vibefrom <= now && vibeto >= now && 0 >= vibetime && vibed != data.latest ){
      vibed = data.latest;
      Vibe.vibrate();
      vibefrom = new Date();
      vibeto = new Date();
      vibefrom.setHours(data.vibe.from.split(':')[0]);
      vibefrom.setMinutes(data.vibe.from.split(':')[1]);
      vibeto.setHours(data.vibe.to.split(':')[0]);
      vibeto.setMinutes(data.vibe.to.split(':')[1]);
    }
  
    view.main.update();
  } else if(view.displayed === 'last' ){
    vibetime = data.last.ride - data.walk - (data.vibe.last * 60);  
    if(vibetime <= 0 && vibed != data.latest) {
      Vibe.vibrate('long');
    }
    view.last.update();
  }
}, 1000);

//Interaction Main
view.wind.main.on('accelTap', function(){
  updateLocation();
  updateRoute(data.routes.length);
});
view.wind.main.on('click', 'up', function(){
  if(data.page !== 0) {
    data.page--;
    data.id = data.routes[data.page].id;
    view.main.slide('prev');
  }
});
view.wind.main.on('click', 'down', function(){
  data.page++;
  if(data.page < data.routes.length -1) {
    data.id = data.routes[data.page].id;
    view.main.slide('next');
  } else {
    view.show('nowLoading');
    updateRoute(data.routes.length+1, data.page);
  }
});
view.wind.main.on('longClick', 'up', function(){
  data.page=0;
  data.id = data.routes[data.page].id;
  view.main.slide('prev');
});
view.wind.main.on('longClick', 'down', function(){
  data.select.page = 0;
  data.select.to = data.stations[data.select.page];
  view.wind.select.to.text(data.select.to);
  view.show('select');
});
view.wind.main.on('longClick', 'select', function(){
  view.show('nowLoading');
  updateLastTrain();
});

//Intreraction LastTrain
view.wind.last.on('click', 'back', function(){
  view.show('main');
});
