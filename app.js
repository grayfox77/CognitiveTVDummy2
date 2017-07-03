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

var entrada = new Object;
var contexto = new Object;

var app = express();

// Bootstrap application settings
app.use(express.static('./public')); // load UI from public folder
app.use(bodyParser.json());

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

    orquestador(req, res);
});

// Implementación por GET del orquestador
app.get('/testClienteAndroid', function (req, res) {

    orquestador(req, res);

});


// Aplicación paginadora de resultados
app.get('/paginator', function (req, res) {

    console.log("En función paginator");
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

function orquestador(req, res) {

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

    // Comprobamos que no venga vacía, y si es así la inicializamos        
    if (typeof req.query.frase == 'undefined' && req.query.frase == null) {
        req.query.frase = '';
        contexto = new Object;
    }

    var response = "<HEAD>" +
        "<title>Cognitive TV Vodafone Dummy Agent</title>\n" +
        "</HEAD>\n" +
        "<BODY>\n" +
        "<P><strong><big><big>Cliente Android</big></big></strong></P>" +
        "<FORM action=\"/testClienteAndroid\" method=\"get\">\n" +
        "<P>\n" +
        "<table  border=1 cellspacing=0 cellpading=0>" +
        "<tr><td width=120 align='right'><strong>Anterior entrada </strong></td><td> <INPUT readonly size=\"120\" style =\"color: #888888; background-color: #DDDDDD;\" type=\"text\"  value=\"" + req.query.frase + "\"></td > </tr>" +
        "</P>\n" +
        "</FORM>\n";

    // Modo cliente o mode web

    if (!(typeof req.query.modoCliente == 'undefined' && req.query.modoCliente == null)) {
        modoCliente = true;
    }

    // Aplicamos stopwords
    var sw = require('stopword');
    const oldString = req.query.frase.split(' ');
    console.log("antes:" + oldString);
    req.query.frase = sw.removeStopwords(oldString, sw.es);
    console.log("despues:", req.query.frase);

    // Convertimos a String y eliminamos las , que introduce la conversión a array
    entrada.text = req.query.frase.toString();
    entrada.text = entrada.text.replace(/,/g, ' ');

    var payload = {
        workspace_id: workspace,
        context: contexto || {},
        input: entrada || {}
    };





    // Send the input to the conversation service
    conversation.message(payload, function (err, data) {
        if (err) {
            console.log("por error");
            return res.status(err.code || 500).json(err);
        }
        else {
            console.log("salida:" + data);
            //console.log("por allá:" + data.intents[0].confidence);

            output = data.output.text;
            console.log("output conversation:" + output);
            response = response + "<tr><td align='right'><strong>Salida Cliente</strong></td><td>" + output + "</td></tr>";
            response = response + "<tr><td align='right'><strong>Entrada Cliente</strong></td><td align ='right'><big> <INPUT size=\"120\" style =\" font-size: large; background-color: #99CCFF;\" type=\"text\" name=\"frase\" value=\"\"></big><br> " +
                "<INPUT type=\"submit\" style=\"font-size: larger;\"  value=\"Enviar al orquestador\"></td></tr></table><br><br>";
            response = response + "<P><strong><big><big>Watson Conversations</big></big></strong></P>" + "<table width=500 border=1 cellspacing=0 cellpading=0>";
            response = response + "<tr><td><strong>genres</strong></td><td>" + data.context.genres + "</td></tr>";
            response = response + "<tr><td width=200><strong>Show_type</strong></td><td width=300>" + data.context.Show_type + "</td></tr>";
            response = response + "<tr><td><strong>titulo</strong></td><td>" + data.context.titulo + "</td></tr>";
            response = response + "<tr><td><strong>cast</strong></td><td>" + data.context.cast + "</td></tr>";
            response = response + "<tr><td><strong>director</strong></td><td>" + data.context.director + "</td></tr>";
            response = response + "<tr><td><strong>novedades</strong></td><td>" + data.context.novedades + "</td></tr>";
            response = response + "<tr><td><strong>valoracion</strong></td><td>" + data.context.valoracion + "</td></tr>";
            response = response + "<tr><td><strong>Lanzar búsqueda WEX</strong></td><td>" + data.context.Busqueda_WEX + "</td></tr>";
            response = response + "</table>";

            // TODO: Meter en un bucle con las propiedades en un array             
            var parametrosBusqueda = "NOT(show_type:Series)";
            var parametrosOrdenacion = "";

            console.log("contexto" + data.context);

            var genres = data.context.genres;
            var show_type = data.context.Show_type;
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
                novedades = process.env.ULTIMAS_NOVEDADES_VALUE;
                parametrosOrdenacion = parametrosOrdenacion + process.env.ORDER_MEJOR_VALORADAS;
                orden = "valoradas";

            }



            if (!(novedades == null)) {
                if (parametrosBusqueda.length > 0) {

                    parametrosBusqueda = parametrosBusqueda + " AND ";
                }
                parametrosBusqueda = parametrosBusqueda + novedades;
            }





            if (!(title == null)) {
                if (parametrosBusqueda.length > 0) {
                    parametrosBusqueda = parametrosBusqueda + " AND ";
                }
                parametrosBusqueda = parametrosBusqueda + "title:" + title;
            }


            if (!(genres == null)) {


                if (parametrosBusqueda.length > 0) {
                    parametrosBusqueda = parametrosBusqueda + " AND ";
                }
                parametrosBusqueda = parametrosBusqueda + "genres:" + genres;
            }



            if (!(show_type == null)) {
                if (parametrosBusqueda.length > 0) {

                    parametrosBusqueda = parametrosBusqueda + " AND ";
                }
                parametrosBusqueda = parametrosBusqueda + "show_type:" + show_type;
            }



            if (!(cast == null)) {
                if (parametrosBusqueda.length > 0) {

                    parametrosBusqueda = parametrosBusqueda + " AND ";
                }
                parametrosBusqueda = parametrosBusqueda + "cast:" + cast;
            }


            if (!(director == null)) {
                if (parametrosBusqueda.length > 0) {

                    parametrosBusqueda = parametrosBusqueda + " AND ";
                }
                parametrosBusqueda = parametrosBusqueda + "director:" + director;
            }




            var lanzar_busqueda_wex = false;

            if (!(data.context.Busqueda_WEX == undefined)) {
                lanzar_busqueda_wex = data.context.Busqueda_WEX;
            }


            var datos;

            if (lanzar_busqueda_wex) {


                funciones_wex.request(parametrosBusqueda, parametrosOrdenacion, 1, function (datos) { //Uso de la funcion request construida en wex.js o similar, recibe los datos en callback "datos"

                    //datos = parseResponse(datos);
                    console.log("después");
                    datos.input = entrada.text;
                    datos.output = data.output.text;
                    datos.llamadaWEX = lanzar_busqueda_wex;
                    datos.context = data.context;


                    console.log("parametrosBusqueda=" + parametrosBusqueda);
                    console.log("parametrosOrdenacion=" + parametrosOrdenacion);
                    console.log("pagina=" + 1);

                    datos.parametrosBusqueda = parametrosBusqueda;
                    datos.parametrosOrdenacion = parametrosOrdenacion;
                    datos.pagina = 1;

                    console.log("WEX resultados:" + datos.es_totalResults);
                    if (modoCliente) {

                        res.send(datos);
                    }

                    else {

                        response = response + "<P><strong><big><big>Resultados WEX </big></big></strong></P>" + "<table width=800 border=1 cellspacing=0 cellpading=0>";
                        response = response + "<tr><td width=100><strong>Número de resultados</strong></td><td width=600>" + datos.es_totalResults + "</td></tr>";
                        response = response + "<tr><td><strong>es_evaluationTruncation</strong></td><td width=300>" + datos.es_evaluationTruncation + "</td></tr>";
                        response = response + "<tr><td><strong>es_queryEvaluationTime</strong></td><td width=300>" + datos.es_queryEvaluationTime + "</td></tr>";
                        response = response + "<tr><td><strong>es_totalResultsType</strong></td><td width=300>" + datos.es_totalResultsType + "</td></tr>";
                        response = response + "<tr><td><strong>es_numberOfAvailableResults</strong></td><td width=300>" + datos.es_numberOfAvailableResults + "</td></tr>";
                        response = response + "<tr><td><strong>es_numberOfEstimatedResults</strong></td><td width=300>" + datos.es_numberOfEstimatedResults + "</td></tr>";
                        response = response + "<tr><td><strong>filtros de la query</strong></td><td width=300>" + datos.es_query[0].searchTerms + "</td></tr>";
                        response = response + "<tr><td><strong>orden de la query</strong></td><td width=300>" + orden + "</td></tr>";


                        if (!(datos.es_result == undefined)) {


                            var listadoTitulos = "";
                            var idPropiedad;

                            if (datos.es_result.length > 1) {


                                response = response + "<tr><td><strong>respuestas devueltas2</strong></td><td width=300>" + datos.es_result.length + "</td></tr>";

                                for (var k = 0; k < datos.es_result.length; k++) {

                                    listadoTitulos = listadoTitulos + datos.es_result[k].es_title + "(";


                                    buscaPosPropiedad(datos.es_result[k], process.env.RATING_FIELD, function (idPropiedad) {
                                        if (!(idPropiedad == undefined)) {
                                            listadoTitulos = listadoTitulos + "rating:" + datos.es_result[k].ibmsc_field[idPropiedad]['#text'];
                                        }
                                    });

                                    var id;
                                    buscaPosPropiedad(datos.es_result[k], process.env.YEAR_FIELD, function (idPropiedad) {
                                        if (!(idPropiedad == undefined)) {
                                            listadoTitulos = listadoTitulos + " year:" + datos.es_result[k].ibmsc_field[idPropiedad]['#text'];
                                        }

                                    });

                                    var id;
                                    buscaPosPropiedad(datos.es_result[k], process.env.GENRE_FIELD, function (idPropiedad) {
                                        if (!(idPropiedad == undefined)) {
                                            listadoTitulos = listadoTitulos + " genre:" + datos.es_result[k].ibmsc_field[idPropiedad]['#text'];
                                        }

                                    });

                                    listadoTitulos = listadoTitulos + ") <br>";
                                }
                            }
                            else {

                                response = response + "<tr><td><strong>respuestas devueltas1</strong></td><td width=300>1</td></tr>";

                                listadoTitulos = listadoTitulos + datos.es_result.es_title + "(";


                                buscaPosPropiedad(datos.es_result, process.env.RATING_FIELD, function (idPropiedad) {
                                    if (!(idPropiedad == undefined)) {
                                        listadoTitulos = listadoTitulos + "rating:" + datos.es_result.ibmsc_field[idPropiedad]['#text'];
                                    }
                                });

                                var id;
                                buscaPosPropiedad(datos.es_result, process.env.YEAR_FIELD, function (idPropiedad) {
                                    if (!(idPropiedad == undefined)) {
                                        listadoTitulos = listadoTitulos + " year:" + datos.es_result.ibmsc_field[idPropiedad]['#text'];
                                    }

                                });

                                var id;
                                buscaPosPropiedad(datos.es_result, process.env.GENRE_FIELD, function (idPropiedad) {
                                    if (!(idPropiedad == undefined)) {
                                        listadoTitulos = listadoTitulos + " genre:" + datos.es_result.ibmsc_field[idPropiedad]['#text'];
                                    }

                                });

                                listadoTitulos = listadoTitulos + ") <br>";
                            }
                            response = response + "<tr><td><strong>Títulos devueltos en llamada</strong></td><td width=300><small>" + listadoTitulos + "</small></td></tr>";
                            response = response + "</table>";
                            response = response + "</BODY > ";
                            res.send(response);
                        }
                        else {
                            response = response + "</BODY > ";
                            res.send(response);
                        }
                    }





                });


            }
            else {


                contexto = data.context;

                if (modoCliente) {

                    res.send(data);
                }

                else {

                    response = response + "</BODY > ";
                    res.send(response);
                }

                // return (response);
                //return res.json(updateMessage(payload, data));

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


module.exports = app;
