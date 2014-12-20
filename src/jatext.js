var UI = require('ui');
var getImage = function(options){
  var size = options.size,
      font = options.font||'',
      fontSize = (font.match(/\d+/)||[])[0]||size.y,
      fontBold = /bold/i.test(font) ? 'bold' : 'normal',
      url = 'http://capturing.herokuapp.com/cap/'+size.x+'/'+size.y+'/'+encodeURIComponent(options.text||' ')+'.png?'+
            'font-size='+fontSize+'px'+
            '&font-weight='+fontBold+
            '&text-align='+(options.textAlign||'left')+
            '&background-color='+(options.backgroundColor||'white')+
            '&color='+(options.color||'black');  
  console.log(options.text ? url : '');
  return options.text ? url : '';
};
var JaText = function(options){
  var ins;
  var image = getImage(options);
  if(image){
    options.image = image;
  }

  ins = new UI.Image(options);
  this.options = options;
  this.ins = ins;
  ins.text = function(text){
    if(options.text != text){
      options.text = text;
      ins.image(getImage(options));    
    }
  };
  return ins;
};


module.exports = JaText;