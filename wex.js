module.exports = {
  request: request,
  mensajeCliente: mensajeCliente
}
var fs = require('fs');
var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
var xml2js = require('xml2js');

const collection = process.env.COLLECTION;
const wexURL = process.env.WEX_URL;
const viewerPath = process.env.WEX_VIEWPATH;


function accessXML2(data, callback) {
  var x = new XMLHttpRequest();
  var parser = new xml2js.Parser();
  if (data.es_result[0] && data.es_result[0].es_link[0]) {
    x.open("GET", data.es_result[0].es_link[0].href, true);
    x.setRequestHeader("Accept-Language", "es-ES");
    x.onreadystatechange = function () {
      if (x.readyState == 4 && x.status == 200) {
        var doc = x.responseText;
        parser.parseString(doc, function (err, result) {
          if (!err) {
            var respuesta = {
              respuesta: result['doc']['text'][0],
              pregunta: result['doc']['pregunta'][0]
            }
            callback(respuesta);
          }
        });
      }
    };
    x.send();
  } else {
    var respuesta = { respuesta: null, pregunta: null }
    callback(respuesta)
  }
}

function accessXML(data, callback) {
  var parser = new xml2js.Parser();
  var nRequest = []
  var respuesta = []
  if (data.es_totalResults > 3) {
    var top = 2;
  }
  else {
    var top = data.es_totalResults - 1;
  }
  for (var i = 0; i <= top; i++) {
    (function (i) {
      nRequest[i] = new XMLHttpRequest();

      if (top == 0) { //FIXME cuidado con la longitud 0, el array pasa a esclar
        var datos = data.es_result
      }
      else {
        var datos = data.es_result[i]
      }

      nRequest[i].open("GET", datos.es_link.href, true);
      nRequest[i].setRequestHeader("Accept-Language", "es-ES");
      nRequest[i].onreadystatechange = function (oEvent) {
        if (nRequest[i].readyState === 4) {
          if (nRequest[i].status === 200) {

            console.log('entrando 4 y 200:' + i + ":" + datos.es_link.href);
            var doc = nRequest[i].responseText;

            parser.parseString(doc, function (err, result) {
              if (!err) {
                respuesta[i] = {
                  respuesta: doc.replace('\n', '\n\n'),
                  summary: createSummary(datos.es_summary, doc),
                  relevancia: datos.es_relevance
                }//FIXME testing
                if (i == top) {

                  console.log('en accessXML1:' + respuesta);

                  respuesta.filter(function (e) { return e === 0 || e }); //FIXME eliminando elementos vacíos
                  respuesta = respuesta.filter(function (entry) { return /\S/.test(entry); });


                  callback("resp:" + respuesta);
                }
                console.log('en accessXML2:' + respuesta);
              }
            });
          } else {
            console.error("No se ha podido obtener el documento: " + nRequest[i].statusText);
          }
        }
      };
      nRequest[i].send(null);
    })(i);
  }
}

function request(input, order, page, callback) {  // Función que lanza la petición a la url


  console.log("Función request - Input:", input);
  console.log("Función request - order:", order);
  console.log("Función request - page:", page);

  // Parece que  WEX devuelve la misma página para page=0 y page=1
  var url = createURL(input, order + process.env.PAGE_NUM + page + process.env.PAGE_SIZE);
  console.log("URL:", url);
  var http = new XMLHttpRequest();
  http.open("GET", url, true);
  http.setRequestHeader("Accept-Language", "es-ES");
  http.onreadystatechange = function () {

    if (http.readyState == 4 && http.status == 200) {

      var data = JSON.parse(http.responseText).es_apiResponse
      //console.log ("data:",data);	

      if (data.es_totalResults > 0) {
        console.log("CON RESULTADOS");

        // accessXML(data,function(response){

        callback(data);
        //})
      } else if (data.es_totalResults == 0) {

        console.log("SIN RESULTADOS");

        callback(data)
      }
    }
  }


  http.send();
}


function createURL(input_and, input_or) { // creacion de URL para WEX, distinguiendo entre condiciones AND y OR
  var params = 'collection=' + collection + '&output=application/json' + '&query=' + input_and;

  //URL: [" + wexURL + '/api/v10/search' + '?' + encodeURI(params) + "]
  return wexURL + '/api/v10/search' + '?' + encodeURI(params) + input_or;
}

function createSummary(summary, id_respuesta) { // Propuesta para la generación de resúmenes
  var final_summary = []
  var array_ellipsis = summary.split('...')
  if (array_ellipsis.length > 3) {
    var top = 3
  } else {
    var top = array_ellipsis.length - 1
  }
  for (var k = 0; k <= top; k++) {
    final_summary.push(array_ellipsis[k])
  }
  summary = final_summary.join('[...]')
  summary = summary.split(id_respuesta)[1]
  return summary

}


function mensajeCliente(input, callback) {  // Función que lanza la petición a la url

  console.log("Función mensajeCliente - Input:", input);
  callback("la respuesta para " + input + " es XXXX ");
  console.log("66");

}


function esBusquedaWEX(input, callback) {  // Función que lanza la petición a la url

  return (true);

}

function componeFiltrosBusquedaWEX(input, callback) {  // Función que lanza la petición a la url

  return (true);

}


