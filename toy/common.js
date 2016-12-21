CLIENT_ID = "56c4f3443da0d6ce6dcb60ba341c4e8d";
var info = document.getElementById("info");
 
var audio = document.querySelector("audio");
audio.crossOrigin = "anonymous";

var canvas = document.querySelector("canvas");
var gl = twgl.getWebGLContext(canvas);
var ext = gl.getExtension("OES_standard_derivatives");
gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
gl.enable(gl.BLEND);
gl.clearColor(0, 0, 0, 1);

var lastObjectUrl = null;
var data = {}, needsCorrection = false;

var clubber = new Clubber({thresholdFactor:0, size: 4096});
clubber.listen(audio);

var types = ["band", "band", "band", "band"];

var smoothArrays = [
  [0.1,0.1,0.1,0.1],
  [0.1,0.1,0.1,0.1],
  [0.1,0.1,0.1,0.1],
  [0.1,0.1,0.1,0.1]
];

var adaptArrays = [
  [1,1,1,1],
  [1,1,1,1],
  [1,1,1,1],
  [1,1,1,1]
];

var rangeArrays = [
  [1, 32, 64, 128],
  [32, 48, 64, 128],
  [48, 64, 64, 128],
  [64, 96,  64, 128]
];

function initClubber () {
  for(var i=0; i<4; i++){
    var param = getParameterByName("s"+i);
    if(param) {
      var smoothArray = smoothArrays[i];
      param.split(",").forEach(function(s,i){
        if( i < smoothArray.length) smoothArray[i] = parseFloat(s);
      });
    }
    param = getParameterByName("r"+i);
    if(param) {
      var rangeArray = rangeArrays[i];
      param.split(",").forEach(function(s,i){
        if( i < rangeArray.length) rangeArray[i] = parseFloat(s);
      });
    }
    param = getParameterByName("a"+i);
    if(param) {
      var adaptArray = adaptArrays[i];
      param.split(",").forEach(function(s,i){
        if( i < adaptArray.length) adaptArray[i] = parseFloat(s);
      });
    }
    param = getParameterByName("t"+i);
    if(param === "rect") {
      types[i] = "rect";
    }
  }

  data.bands = [];
  for(var i=0; i<4; i++){
    data.bands.push( clubber[types[i]]({
      from: rangeArrays[i][0], to: rangeArrays[i][1], low: rangeArrays[i][2], high: rangeArrays[i][3],
      smooth: smoothArrays[i], adapt: adaptArrays[i]
    }));
  }
}

var handleDragOver = function(e) {
    e.preventDefault();
    e.stopPropagation();
}
var handleDrop = function(e) {
    e.preventDefault();
    e.stopPropagation();
    var objectUrl = URL.createObjectURL(e.dataTransfer.files[0]);
    play(objectUrl, true);
}

canvas.addEventListener('drop', handleDrop, false);
canvas.addEventListener('dragover', handleDragOver, false);

function maximize () {
  var el = document.querySelector("canvas");
  var fs = el.webkitRequestFullScreen || el.requestFullScreen || msRequestFullScreen;
  fs.call(el);
}

function getParameterByName(name) {
  name = name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
  var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"), results = regex.exec(location.search);
  return results == null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
}

function play (src, dropped) {
  if(lastObjectUrl){
    URL.revokeObjectURL(lastObjectUrl);
    lastObjectUrl = null;
  }
  if(!dropped) {
    src = '//api.soundcloud.com/tracks/'+src+'/stream?client_id=' + CLIENT_ID;
  } else {
    lastObjectUrl = src;
  }
  audio.src=src;
  audio.play();
}

function load (url) {
  return new Promise(function (resolve, reject) {
    var xhr = new XMLHttpRequest();
    xhr.open("GET", url);
    xhr.onload = function () {
      if (this.status >= 200 && this.status < 300) {
        resolve(xhr.response);
      } else {
        reject({
          status: this.status,
          statusText: xhr.statusText
        });
      }
    };
    xhr.onerror = function () {
      reject({
        status: this.status,
        statusText: xhr.statusText
      });
    };
    xhr.send();
  });
}

function change () {
  var url = localStorage.getItem("soundcloud-track");
  url = prompt("Enter a soundcloud track url", url);
  if (url) soundcloud(url);
}

function soundcloud(url) {
  load("//api.soundcloud.com/resolve?url=" + encodeURIComponent(url.split("?")[0]) + "&client_id=" + CLIENT_ID).then(function (text) {
    var data = JSON.parse(text);
    console.log(data);
    if (data.kind !== "track"){
      alert( "Please provide a track url, " + data.kind + " urls are not supported.");
      return;
    }
    info.innerHTML = "<a href='"+data.permalink_url+"' target='_blank'>Listening to "+data.title+" by "+data.user.username+"</a>";
    localStorage.setItem("soundcloud-track", url);
    play(data.id);
  }, function () {
    alert(url + " is not a valid soundcloud track url.")
  })
}

if (getParameterByName("reset")){
  localStorage.removeItem("soundcloud-track");
} 