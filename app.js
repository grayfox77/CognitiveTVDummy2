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


app.post('/testClienteAndroid', function (req, res) {

    orquestador(req, res);
});

app.get('/testClienteAndroid', function (req, res) {

    orquestador(req, res);

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
            response = response + "<tr><td align='right'><strong>Entrada Cliente</strong></td><td align ='right'><big> <INPUT size=\"120\" style =\" font-size: large; background-color: #99CCFF;\" type=\"text\" name=\"frase\" value=\" \"></big><br> " +
                "<INPUT type=\"submit\" style=\"font-size: larger;\"  value=\"Enviar al orquestador\"></td></tr></table><br><br>";
            response = response + "<P><strong><big><big>Watson Conversations</big></big></strong></P>" + "<table width=400 border=1 cellspacing=0 cellpading=0>";
            response = response + "<tr><td><strong>genres</strong></td><td>" + data.context.genres + "</td></tr>";
            response = response + "<tr><td><strong>Show_type</strong></td><td width=300>" + data.context.Show_type + "</td></tr>";
            response = response + "<tr><td><strong>title</strong></td><td>" + data.context.title + "</td></tr>";
            response = response + "<tr><td><strong>cast</strong></td><td>" + data.context.cast + "</td></tr>";
            response = response + "<tr><td><strong>director</strong></td><td>" + data.context.director + "</td></tr>";
            response = response + "<tr><td><strong>novedades</strong></td><td>" + data.context.novedades + "</td></tr>";
            response = response + "<tr><td><strong>valoracion</strong></td><td>" + data.context.valoracion + "</td></tr>";
            response = response + "</table>";

            // TODO: Meter en un bucle con las propiedades en un array             
            var parametrosBusqueda = "NOT(show_type:Series)";


            var genres = data.context.genres;
            var show_type = data.context.Show_type;
            var title = data.context.title;
            var cast = data.context.cast;
            var director = data.context.director;
            var novedades = data.context.novedades;
            var valoracion = data.context.valoracion;


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


            if (!(novedades == null)) {
                if (parametrosBusqueda.length > 0) {

                    parametrosBusqueda = parametrosBusqueda + " AND ";
                }
                parametrosBusqueda = parametrosBusqueda + "novedades:" + novedades;
            }

            if (!(valoracion == null)) {
                if (parametrosBusqueda.length > 0) {

                    parametrosBusqueda = parametrosBusqueda + " AND ";
                }
                parametrosBusqueda = parametrosBusqueda + "valoracion:" + valoracion;
            }


            var lanzar_busqueda_wex = false;

            //lanzar_busqueda_wex = data.context.busqueda_wex;              
            lanzar_busqueda_wex = true;

            var datos;

            if (lanzar_busqueda_wex) {

                funciones_wex.request(parametrosBusqueda, function (datos) { //Uso de la funcion request construida en wex.js o similar, recibe los datos en callback "datos"

                    //datos = parseResponse(datos);
                    console.log("después");
                    datos.input = entrada.text;
                    datos.output = data.output.text;
                    datos.context = data.context;

                    if (!(datos == null)) {

                        console.log("WEX resultados:" + datos.es_totalResults);

                    }

                    else {

                        console.log("WEX: Sin resultados");
                    }



                    if (modoCliente) {

                        res.send(datos);
                    }

                    else {

                        response = response + "<P><strong><big><big>Resultados WEX </big></big></strong></P>" + "<table width=800 border=1 cellspacing=0 cellpading=0>";
                        response = response + "<tr><td width=100><strong>Flag invocación a WEX</strong></td><td width=600>" + lanzar_busqueda_wex + "</td></tr>";
                        response = response + "<tr><td width=100><strong>Número de resultados</strong></td><td width=600>" + datos.es_totalResults + "</td></tr>";
                        response = response + "<tr><td><strong>es_evaluationTruncation</strong></td><td width=300>" + datos.es_evaluationTruncation + "</td></tr>";
                        response = response + "<tr><td><strong>es_queryEvaluationTime</strong></td><td width=300>" + datos.es_queryEvaluationTime + "</td></tr>";
                        response = response + "<tr><td><strong>es_totalResultsType</strong></td><td width=300>" + datos.es_totalResultsType + "</td></tr>";
                        response = response + "<tr><td><strong>es_numberOfAvailableResults</strong></td><td width=300>" + datos.es_numberOfAvailableResults + "</td></tr>";
                        response = response + "<tr><td><strong>es_numberOfEstimatedResults</strong></td><td width=300>" + datos.es_numberOfEstimatedResults + "</td></tr>";
                        response = response + "<tr><td><strong>filtros de la query</strong></td><td width=300>" + datos.es_query[0].searchTerms + "</td></tr>";

                        if (!(datos.es_result == null)) {

                            response = response + "<tr><td><strong>respuestas devueltas</strong></td><td width=300>" + datos.es_result.length + "</td></tr>";
                            var listadoTitulos = "";
                            for (var k = 0; k < datos.es_result.length; k++) {
                                listadoTitulos = listadoTitulos + datos.es_result[k].es_title + "<br>";
                            }
                            response = response + "<tr><td><strong>Títulos devueltos en llamada</strong></td><td width=300><small>" + listadoTitulos + "</small></td></tr>";

                        }

                        response = response + "</table>";
                        response = response + "</BODY > ";
                        res.send(response);
                    }
                });


            }
            else {



                contexto = data.context;
                ;
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