/**
 * Copyright 2015 IBM Corp. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

var express = require('express'); // app server
var bodyParser = require('body-parser'); // parser for post requests
var Conversation = require('watson-developer-cloud/conversation/v1'); // watson sdk
var funciones_wex = require('./wex.js');

var uuid = require( 'uuid' ); 
var vcapServices = require( 'vcap_services' ); 
var basicAuth = require( 'basic-auth-connect' ); 

// The app owner may optionally configure a cloudand db to track user input. 
// This cloudand db is not required, the app will operate without it. 
// If logging is enabled the app must also enable basic auth to secure logging 
// endpoints 
var cloudantCredentials = vcapServices.getCredentials( 'cloudantNoSQLDB' ); 
var cloudantUrl = null; 
if ( cloudantCredentials ) {
	console.info("Configurado url de BBDD desde vcapServices:"+cloudantCredentials.url);
	cloudantUrl = cloudantCredentials.url; 
} 
cloudantUrl = cloudantUrl || process.env.CLOUDANT_URL; // || '<cloudant_url>'; 

var logDDBB = null;
var NAME_LOGDDBB = process.env.NAME_LOGDDBB;

var entrada = new Object;
//var contexto = new Object;

var app = express();

// Bootstrap application settings
app.use(express.static('./public')); // load UI from public folder
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
	  extended: true
	})); 

// Create the service wrapper
var conversation = new Conversation({
    // If unspecified here, the CONVERSATION_USERNAME and CONVERSATION_PASSWORD env properties will be checked
    // After that, the SDK will fall back to the bluemix-provided VCAP_SERVICES environment property
    username: '91c96d26-075a-4fae-aafd-c73095a5c848',
    password: 'pWZ5SMCv68Y2',
    url: 'https://gateway-fra.watsonplatform.net/conversation/api',
    version_date: Conversation.VERSION_DATE_2017_04_21
});



// Aplicación por defecto de WATSON CONVERSATION   - Borrar si se requiere
app.post('/api/message', function (req, res) {
    var workspace = process.env.WORKSPACE_ID || '<workspace-id>';
    if (!workspace || workspace === '<workspace-id>') {
        return res.json({
            'output': {
                'text': 'The app has not been configured with a <b>WORKSPACE_ID</b> environment variable. Please refer to the ' + '<a href="https://github.com/watson-developer-cloud/conversation-simple">README</a> documentation on how to set this variable. <br>' + 'Once a workspace has been defined the intents may be imported from ' + '<a href="https://github.com/watson-developer-cloud/conversation-simple/blob/master/training/car_workspace.json">here</a> in order to get a working application.'
            }
        });
    }
    var payload = {
        workspace_id: workspace,
        context: req.body.context || {},
        input: req.body.input || {}
    };

    // Send the input to the conversation service
    conversation.message(payload, function (err, data) {
        if (err) {
            return res.status(err.code || 500).json(err);
        }
        return res.json(updateMessage(payload, data));
    });
});


// Invocación por POST para Android 
app.post('/testClienteAndroid', function (req, res) {

	entradaPrincipal(req, res);
    
});

// Implementación por GET del orquestador
app.get('/testClienteAndroid', function (req, res) {

    //if (req.query.frase == '') {
	entradaPrincipal(req, res);
    //}

});


// Aplicación paginadora de resultados
app.get('/paginator', function (req, res) {

    console.log("En función paginator");
    // http://localhost:3000/paginator?parametrosBusqueda=show_type:Cine&parametrosOrdenacion=&pagina=2
    funciones_wex.request(req.query.parametrosBusqueda, req.query.parametrosOrdenacion, req.query.pagina, function (datos) {

        console.log("WEX resultados:" + datos.es_totalResults);

        res.send(datos);

    });
});

app.post('/paginator', function (req, res) {

    console.log("En función paginator");
    funciones_wex.request(req.query.parametrosBusqueda, req.query.parametrosOrdenacion, req.query.pagina, function (datos) {

        console.log("WEX resultados:" + datos.es_totalResults);

        res.send(datos);

    });
});


function entradaPrincipal(req,res) {
	console.info("--->Recibido una nueva petición")
        peticionClienteAndroid(req, res);
}
/**
 * Funcion que devuelve los datos como cliente de android puro o a la aplicacion Dummy.
 * @param req
 * @param res
 * @param datos
 * @returns
 */
function devuelveDatos(req,res,datos) {
	console.info("<-----Contexto Final:"+JSON.stringify(datos.context));
	//res.charset='ISO-8859-1';
    if (!(typeof req.query.modoCliente == 'undefined' && req.query.modoCliente == null)) {
    	//res.set({ 'Content-Type': 'application/json; charset=utf-8' })
        res.send(datos);
    } else {
    	//res.set({ 'Content-Type': 'text/html; charset=iso-8859-1' })
    	//res.setHeader("Content-Type", "text/html; charset=iso-8859-1");
    	aplicacionDummy(req,res,datos);
    }		
}

function escapeJSON(datos) {
	return JSON.stringify(datos).replace(/'/g,"&apos;");
	//return JSON.stringify(datos);
}
function aplicacionDummy(req,res,datosClienteAndroid) {
	//console.info("Datos cliente android:"+JSON.stringify(datosClienteAndroid));
	console.info("Sirviendo peticion aplicacion Dummy");
	var frase = req.query.frase || req.body.frase;
    if (frase == 'undefined' || frase == null) {
        frase = '';
//        contexto = new Object;
    }	
    var response = "<HEAD>" +
    "<title>Cognitive TV Vodafone Dummy Agent</title>\n" +
    "<link rel=\"stylesheet\" href=\"css/app.css\">\n " +
    "</HEAD>\n" +
    "<BODY onload='displayPayload()' >\n" +
    "<P><strong><big><big><a href=\"/testClienteAndroid\">Cliente Android</a></big></big></strong></P>" +
    "<FORM action=\"/testClienteAndroid\" method=\"post\">\n" +
    "<P>\n" +
    "<table  border=1 cellspacing=0 cellpading=0>" +
    "<tr><td width=120 align='right'><strong>Anterior entrada </strong></td><td><INPUT readonly size=\"120\" style =\"color: #888888; background-color: #DDDDDD;\" type=\"text\"  value=\"" + frase + "\">" +
    "<INPUT id = \"hiddenContext\" name=\"context\" type=\"hidden\" size=\"120\" style =\"color: #888888; background-color: #DDDDDD;\" type=\"text\"  value='" + escapeJSON(datosClienteAndroid.context) + "'></td > </tr>" +
    "</P>\n" +
    "</FORM>\n";
    response = response + "<tr><td align='right'><strong>Salida Cliente</strong></td><td>" + datosClienteAndroid.output + "</td></tr>";
    response = response + "<tr><td align='right'><strong>Entrada Cliente</strong></td><td align ='right'><big> <INPUT size=\"120\" style =\" font-size: large; background-color: #99CCFF;\" type=\"text\" name=\"frase\" value=\"\" autofocus></big><br> " +
        "<INPUT type=\"submit\" style=\"font-size: larger;\"  value=\"Enviar al orquestador\"></td></tr></table><br><br>";
    response = response + "<P><strong><big><big>Watson Conversations</big></big></strong></P>" + "<table width=500 border=1 cellspacing=0 cellpading=0>";
    response = response + "<tr><td><strong>genres</strong></td><td>" + datosClienteAndroid.context.genres + "</td></tr>";
    response = response + "<tr><td width=200><strong>show_type</strong></td><td width=300>" + datosClienteAndroid.context.show_type + "</td></tr>";
    response = response + "<tr><td><strong>titulo</strong></td><td>" + datosClienteAndroid.context.titulo + "</td></tr>";
    response = response + "<tr><td><strong>cast</strong></td><td>" + datosClienteAndroid.context.cast + "</td></tr>";
    response = response + "<tr><td><strong>director</strong></td><td>" + datosClienteAndroid.context.director + "</td></tr>";
    response = response + "<tr><td><strong>novedades</strong></td><td>" + datosClienteAndroid.context.novedades + "</td></tr>";
    response = response + "<tr><td><strong>valoracion</strong></td><td>" + datosClienteAndroid.context.valoracion + "</td></tr>";
    response = response + "<tr><td><strong>numPalabrasEntrada</strong></td><td>" + datosClienteAndroid.context.numPalabrasEntrada + "</td></tr>";  
    response = response + "<tr><td><strong>numPalabrasEntradaRaw</strong></td><td>" + datosClienteAndroid.context.numPalabrasEntradaRaw + "</td></tr>";
    response = response + "<tr><td><strong>es_totalResults(Anterior)</strong></td><td>" + datosClienteAndroid.context.es_totalResults + "</td></tr>";
    response = response + "<tr><td><strong>Lanzar búsqueda WEX</strong></td><td>" + datosClienteAndroid.context.Busqueda_WEX + "</td></tr>";
    response = response + "</table>";
    if (datosClienteAndroid.context.Busqueda_WEX) {
	    response = response + "<P><strong><big><big>Resultados WEX </big></big></strong></P>" + "<table width=800 border=1 cellspacing=0 cellpading=0>";
	    response = response + "<tr><td width=100><strong>Número de resultados</strong></td><td width=600>" + datosClienteAndroid.es_totalResults + "</td></tr>";
	    response = response + "<tr><td><strong>es_evaluationTruncation</strong></td><td width=300>" + datosClienteAndroid.es_evaluationTruncation + "</td></tr>";
	    response = response + "<tr><td><strong>es_queryEvaluationTime</strong></td><td width=300>" + datosClienteAndroid.es_queryEvaluationTime + "</td></tr>";
	    response = response + "<tr><td><strong>es_totalResultsType</strong></td><td width=300>" + datosClienteAndroid.es_totalResultsType + "</td></tr>";
	    response = response + "<tr><td><strong>es_numberOfAvailableResults</strong></td><td width=300>" + datosClienteAndroid.es_numberOfAvailableResults + "</td></tr>";
	    response = response + "<tr><td><strong>es_numberOfEstimatedResults</strong></td><td width=300>" + datosClienteAndroid.es_numberOfEstimatedResults + "</td></tr>";
	    response = response + "<tr><td><strong>filtros de la query</strong></td><td width=300>" + datosClienteAndroid.es_query[0].searchTerms + "</td></tr>";
	    response = response + "<tr><td><strong>orden de la query</strong></td><td width=300>" + datosClienteAndroid.parametrosOrdenacion + "</td></tr>";
	    var resTitulos=listadoTitulos(datosClienteAndroid.es_result);
	    response = response + "<tr><td><strong>respuestas devueltas</strong></td><td width=300>" + resTitulos.numElementos + "</td></tr>";    
	    response = response + "<tr><td><strong>Títulos devueltos en llamada</strong></td><td width=300><small>" + resTitulos.listadoTitulos + "</small></td></tr>";
	    response = response + "</table>";
    }
    //response = response + "<div>"+escapeJSON(datosClienteAndroid.context)+"</div> ";
    response = response + "<br><div id=\"payload-response\" class=\"payload\"></div> ";
    response = response + "<script src=\"js/common.js\"></script>";
    response = response + "<script src=\"js/printContext.js\"></script>";
    response = response + "</BODY > ";
    res.send(response);
}

function listadoTitulos(result) {
	var resultado=new Object();
	var listadoTitulos = "";
	var listadoResultado=[];
    if (!(result == undefined)) {

    	var idPropiedad;
        
        if (result.length > 1) {
        	listadoResultado = result;
        } else {
        	listadoResultado = [result];
        }



            for (var k = 0; k < listadoResultado.length; k++) {

                listadoTitulos = listadoTitulos + listadoResultado[k].es_title + "(";


                buscaPosPropiedad(listadoResultado[k], process.env.RATING_FIELD, function (idPropiedad) {
                    if (!(idPropiedad == undefined)) {
                        listadoTitulos = listadoTitulos + "rating:" + listadoResultado[k].ibmsc_field[idPropiedad]['#text'];
                    }
                });

                var id;
                buscaPosPropiedad(listadoResultado[k], process.env.YEAR_FIELD, function (idPropiedad) {
                    if (!(idPropiedad == undefined)) {
                        listadoTitulos = listadoTitulos + " year:" + listadoResultado[k].ibmsc_field[idPropiedad]['#text'];
                    }

                });

                var id;
                buscaPosPropiedad(listadoResultado[k], process.env.GENRE_FIELD, function (idPropiedad) {
                    if (!(idPropiedad == undefined)) {
                        listadoTitulos = listadoTitulos + " genre:" + listadoResultado[k].ibmsc_field[idPropiedad]['#text'];
                    }

                });

                listadoTitulos = listadoTitulos + ") <br>";
            }
    }
    resultado.numElementos=listadoResultado.length;
    resultado.listadoTitulos=listadoTitulos;
    return resultado;
}

function limpiarSimbolos(cadena) {
	var res=cadena;
	res=res.replace(/[¿\?:!¡.,\(\)\[\]"';_+\-{}<>$&\/]/g,' ');
	res=res.replace(/ +/g,' ');
	res=res.trim();
	console.info("Cadena limpiada: " +cadena);
	return res;
}

function peticionClienteAndroid(req, res) {

    var output;
    var modoCliente = false;

    var workspace = process.env.WORKSPACE_ID || '<workspace-id>';
    if (!workspace || workspace === '<workspace-id>') {
        return res.json({
            'output': {
                'text': 'The app has not been configured with a <b>WORKSPACE_ID</b> environment variable. Please refer to the ' + '<a href="https://github.com/watson-developer-cloud/conversation-simple">README</a> documentation on how to set this variable. <br>' + 'Once a workspace has been defined the intents may be imported from ' + '<a href="https://github.com/watson-developer-cloud/conversation-simple/blob/master/training/car_workspace.json">here</a> in order to get a working application.'
            }
        });
    }
    var frase = req.body.frase || req.query.frase ;
    // Comprobamos que no venga vacía, y si es así la inicializamos        
    if (frase == 'undefined' || frase == null) {
        frase = '';
//        contexto = new Object;
    }
    console.info("El valor de la frase <"+frase +">");

    // Aplicamos stopwords
    var sw = require('stopword');
    var rawInput=req.query.frase;
    const oldString = frase.split(' ');

    // Convertimos a String y eliminamos las , que introduce la conversión a array
    entrada.text = frase.toString();
    entrada.text = entrada.text.replace(/,/g, ' ');
    // Estableciendo variables en el contexto
	
	console.info("Contexto en el body al estilo:"+JSON.stringify(req.body.context));
	var paramContext ={};
	if (req.body.context) {
		console.info('El tipo del context'+(typeof req.body.context));
		if (typeof req.body.context == 'string') {
			paramContext = JSON.parse(req.body.context);
			console.info("El contexto recien parseado"+JSON.stringify(paramContext));
		} else if (typeof req.body.context == 'object'){
			paramContext = req.body.context;
			console.info("El contexto recien parseado modo apk"+JSON.stringify(paramContext));
		} 
	}
    var payload = {
        workspace_id: workspace,
        context: paramContext,
        input: entrada || {}
    };
    console.info("El contexto de entrada es:"+JSON.stringify(paramContext));


    payload.context.numPalabrasEntradaRaw=oldString.length;
    payload.context.numPalabrasEntrada=entrada.text.split(' ').length;


    //console.info("Payload:"+JSON.stringify(payload));
    // Send the input to the conversation service
    console.info("Se realiza la primera llamada a Conversation");
    conversation.message(payload, function (err, data) {
    	console.log("Callback primera llamada a conversation.");
    	var idLog = null;     	
        if (err) {
            console.log("por error");
            return res.status(err.code || 500).json(err);
        }
        else {
       	
            //console.log("salida:" + data);
            if (logDDBB) {
                // If the logs db is set, then we want to record all input and responses 
            	idLog = uuid.v4(); 
            	logDDBB.insert( {'_id': idLog, 'request': rawInput  + " --> " +entrada, 'response': data, 'time': new Date()}); 
            }
            //console.log("por allá:" + data.intents[0].confidence);

            output = data.output.text;
            //console.log("output conversation:" + output);
            // TODO: Meter en un bucle con las propiedades en un array             
            //var parametrosBusqueda = "NOT(show_type:Series)";
            var parametrosBusqueda = "";
            var parametrosOrdenacion = "";


           // console.log("Contexto en json:" +res.json(data.context));

            var genres = data.context.genres;
            var show_type = data.context.show_type;
            var title = data.context.titulo;
            var cast = data.context.cast;
            var director = data.context.director;
            var novedades = data.context.novedades;
            var valoracion = data.context.valoracion;

            var orden = "";

            if ((novedades == process.env.ULTIMAS_NOVEDADES) && (!(valoracion == process.env.MEJOR_VALORADAS))) {
                parametrosOrdenacion = parametrosOrdenacion + process.env.ORDER_ULTIMAS_NOVEDADES;
                orden = "novedades";
            }

            if ((!(novedades == process.env.ULTIMAS_NOVEDADES)) && (valoracion == process.env.MEJOR_VALORADAS)) {
                parametrosOrdenacion = parametrosOrdenacion + process.env.ORDER_MEJOR_VALORADAS;
                orden = "valoradas";
            }

            if ((novedades == process.env.ULTIMAS_NOVEDADES) && (valoracion == process.env.MEJOR_VALORADAS)) {
                //novedades = process.env.ULTIMAS_NOVEDADES_VALUE;
                parametrosOrdenacion = parametrosOrdenacion + process.env.ORDER_MEJOR_VALORADAS;
                orden = "valoradas";

            }


            if ("novedades" == novedades) {
                parametrosBusqueda = agregarParametroBusq(parametrosBusqueda,"year:","2017");
            }

            parametrosBusqueda = agregarParametroBusq(parametrosBusqueda,"title:",title);
            parametrosBusqueda = agregarParametroBusq(parametrosBusqueda,"genres:",genres);
            parametrosBusqueda = agregarParametroBusq(parametrosBusqueda,"show_type:",show_type);
            parametrosBusqueda = agregarParametroBusq(parametrosBusqueda,"cast:",cast);
            parametrosBusqueda = agregarParametroBusq(parametrosBusqueda,"director:",director);

            // TODO Que se utiliza el que nosotros tenemos y hemos enviado o la variable de conversation 
            var palabrasEntrada = [];
            
            if (typeof data.context.input_text == 'string') {
            	palabrasEntrada = limpiarSimbolos(data.context.input_text).split(' ');
            }
            
            var arrEntrada_filtrado=sw.removeStopwords(palabrasEntrada, sw.es);
            var filtroInputEntrada = arrEntrada_filtrado.toString();
            filtroInputEntrada=filtroInputEntrada.replace(/,/g, ' OR ');
        	if (filtroInputEntrada != null && '' != filtroInputEntrada ) { 
        		parametrosBusqueda = agregarParametroBusq(parametrosBusqueda,"","("+filtroInputEntrada+")");
        	}

            var lanzar_busqueda_wex = false;

            if (!(data.context.Busqueda_WEX == undefined)) {
                lanzar_busqueda_wex = data.context.Busqueda_WEX;
            }


            var datos;
            
            //contexto = data.context;
            //console.log("contexto antes :" + JSON.stringify(contexto));
            

        	if (output =='Perfecto, te muestro lo que he encontrado, si quieres seguimos buscando.') {
        		delete data.context.titulo;
        	}        	
        	
        	
            if (lanzar_busqueda_wex) {
            	console.info("Se realiza la llamada a Wex");

                funciones_wex.request(parametrosBusqueda, parametrosOrdenacion, 1, function (datos) { //Uso de la funcion request construida en wex.js o similar, recibe los datos en callback "datos"

                    console.log("Callback llamada wex:");
                    datos.input = entrada.text;
                    datos.output = data.output.text;
                    data.context.es_totalResults = datos.es_totalResults;
                    datos.context = data.context;
                    datos.context.es_totalResults = datos.es_totalResults;

                    datos.parametrosBusqueda = parametrosBusqueda;
                    datos.parametrosOrdenacion = parametrosOrdenacion;
                    datos.pagina = 1;
                    

                    console.log("WEX total resultados:" + datos.es_totalResults);
                        //res.send(datos);
                    var entrada2 = {"text":"ActualizandoContextoOrquestador"};
                    payload.input = entrada2;
                    payload.context = datos.context;
                    //console.info("Mensaje 2 a conversation:",JSON.stringify(payload));
                    console.info("Se realiza la segunda llamada a Conversation.");
                    conversation.message(payload, function (err, data2) {
                    	console.info("Callback de la segunda llamada a Conversation.");
                    	//console.log("Segunda llamada a conversation:"+JSON.stringify(data2));
                    	//console.log("Segunda llamada a conversation:"+JSON.stringify(err));
                    	//console.log("Se ha llamado al conversation la segunda vez y ha devuelto:"+data2.output.text)
                    	console.info(JSON.stringify(data2.context));
                    	datos.context = data2.context;
                    	datos.output = data2.output.text;
                    	devuelveDatos(req,res,datos);
                    });
                });
            }
            else {
            	console.info("No se realiza la llamada a Wex.");
                var responseConversation = {
                    input : data.input.text,
                    output : data.output.text,
                    context: data.context,
                    es_result : [],
                    llamadaWEX : false                    
                }

                //res.send(data);                    
                //console.log("### RESPONSE FROM CONVERSATION :: " , responseConversation);
                //res.send(responseConversation);
                devuelveDatos(req,res,responseConversation);
            }
        }


    });


};


function buscaPosPropiedad(data, propiedad, callback) {


    var id;
    for (var k = 0; k < data.ibmsc_field.length; k++) {


        if (data.ibmsc_field[k]['id'] == propiedad) {
            id = k;

        }
    }
    callback(id);

}

/**
 * Updates the response text using the intent confidence
 * @param  {Object} input The request to the Conversation service
 * @param  {Object} response The response from the Conversation service
 * @return {Object}          The response with the updated message
 */
function updateMessage(input, response) {

    console.log("Entrando en update");
    var responseText = null;
    if (!response.output) {

        response.output = {};
    } else {
        console.log("2");
        return response;
    }
    if (response.intents && response.intents[0]) {

        console.log("Por aquí nunca entro o qué?");
        var intent = response.intents[0];
        // Depending on the confidence of the response the app can return different messages.
        // The confidence will vary depending on how well the system is trained. The service will always try to assign
        // a class/intent to the input. If the confidence is low, then it suggests the service is unsure of the
        // user's intent . In these cases it is usually best to return a disambiguation message
        // ('I did not understand your intent, please rephrase your question', etc..)
        if (intent.confidence >= 0.75) {
            responseText = 'I understood your intent was ' + intent.intent;
        } else if (intent.confidence >= 0.5) {
            responseText = 'I think your intent was ' + intent.intent;
        } else {
            responseText = 'I did not understand your intent';
        }
    }
    response.output.text = responseText;
    return response;
}


function agregarParametroBusq(parametrosBusqueda,campo,valor) {

	if (valor != null && '' != valor ) {
		var strAuxiliar=parametrosBusqueda;
	    if (strAuxiliar.length > 0) {
	
	    	strAuxiliar = strAuxiliar + " AND ";
	    }
	    return strAuxiliar + campo + valor;
	} else {
		return parametrosBusqueda;
	}
	
}

function parseResponse(datos) {
    console.log("antes");
    var result = {
        es_totalResults: "",
        es_result: []

    };
    result.es_totalResults = datos.es_totalResults;


    for (var i = 0; i < datos.es_result.length; i++) {

        console.log("longitud:" + datos.es_result.length);
        result.es_result[i] = {
            title: datos.es_result[i].es_title,
            description: datos.es_result[i].ibmsc_field[11]['#text'],
            thumbnail: datos.es_result[i].es_thumbnail.href,
            background: datos.es_result[i].es_link.href
        };
    }

    console.log("RESPONSE :: ", result);
    return datos;
};


if ( cloudantUrl ) { 
	   // If logging has been enabled (as signalled by the presence of the cloudantUrl) then the 
	   // app developer must also specify a LOG_USER and LOG_PASS env vars. 
	   if ( !process.env.LOG_USER || !process.env.LOG_PASS ) { 
	     throw new Error( 'LOG_USER OR LOG_PASS not defined, both required to enable logging!' ); 
	   } 
	   // add basic auth to the endpoints to retrieve the logs! 
	   var auth = basicAuth( process.env.LOG_USER, process.env.LOG_PASS ); 
	   // If the cloudantUrl has been configured then we will want to set up a nano client 
	   var nano = require( 'nano' )( cloudantUrl ); 
	   // add a new API which allows us to retrieve the logs (note this is not secure) 
	   nano.db.get( NAME_LOGDDBB, function(err) { 
	     if ( err ) { 
	    	 console.info("Hay error al obtener la BBDD:"+NAME_LOGDDBB);
	       console.error(err); 
	       nano.db.create( NAME_LOGDDBB, function(errCreate) {
	    	   console.info("Se intenta volver a crear la BBDD:")
	         console.error(errCreate); 
	         logDDBB = nano.db.use( NAME_LOGDDBB ); 
	       } ); 
	     } else { 
	    	 console.info("Utilizando la BBDD"+NAME_LOGDDBB);
	    	 logDDBB = nano.db.use( NAME_LOGDDBB ); 
	     } 
	   } ); 
	  
	   // Endpoint which allows deletion of db 
	   app.post( '/clearDb', auth, function(req, res) { 
	     nano.db.destroy( NAME_LOGDDBB, function() { 
	       nano.db.create( NAME_LOGDDBB, function() { 
	    	   logDDBB = nano.db.use( NAME_LOGDDBB ); 
	       } ); 
	     } ); 
	     return res.json( {'message': 'Clearing db'} ); 
	   } ); 	   
	  
	   // Endpoint which allows conversation logs to be fetched 
	   //app.get( '/chats', auth, function(req, res) {
	   app.get( '/chats', function(req, res) {
		   logDDBB.list( {include_docs: true, 'descending': true}, function(err, body) { 
	       console.error(err); 
	       // download as CSV 
	       var csv = []; 
	       csv.push( ['Question', 'Intent', 'Confidence', 'Entity', 'Output', 'Time'] );
	       console.log("Numero de filas en la BBDD de logs"+body.row.length);
	       if (body != null) {
	       body.rows.sort( function(a, b) { 
	         if ( a && b && a.doc && b.doc ) { 
	           var date1 = new Date( a.doc.time ); 
	           var date2 = new Date( b.doc.time ); 
	           var t1 = date1.getTime(); 
	           var t2 = date2.getTime(); 
	           var aGreaterThanB = t1 > t2; 
	           var equal = t1 === t2; 
	           if (aGreaterThanB) { 
	             return 1; 
	           } 
	           return  equal ? 0 : -1; 
	         } 
	       } ); 
	       body.rows.forEach( function(row) { 
	         var question = ''; 
	         var intent = ''; 
	         var confidence = 0; 
	         var time = ''; 
	         var entity = ''; 
	         var outputText = ''; 
	         if ( row.doc ) { 
	           var doc = row.doc; 
	           if ( doc.request && doc.request.input ) { 
	             question = doc.request.input.text; 
	           } 
	           if ( doc.response ) { 
	             intent = '<no intent>'; 
	             if ( doc.response.intents && doc.response.intents.length > 0 ) { 
	               intent = doc.response.intents[0].intent; 
	               confidence = doc.response.intents[0].confidence; 
	             } 
	             entity = '<no entity>'; 
	             if ( doc.response.entities && doc.response.entities.length > 0 ) { 
	               entity = doc.response.entities[0].entity + ' : ' + doc.response.entities[0].value; 
	             } 
	             outputText = '<no dialog>'; 
	             if ( doc.response.output && doc.response.output.text ) { 
	               outputText = doc.response.output.text.join( ' ' ); 
	             } 
	           } 
	           time = new Date( doc.time ).toLocaleString(); 
	         } 
	         csv.push( [question, intent, confidence, entity, outputText, time] ); 
	       } );
		   };
	       res.json( csv ); 
	     } ); 
	   } ); 
}  // Fin  if cloudantUrl 

console.log("Arrancando la aplicación");

module.exports = app;
