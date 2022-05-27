// API : https://www.vatcomply.com/documentation

window.addEventListener("load",init);
var nodeToJSON = new WeakMap();

// declaro variable globales, almacenarán los valores base -> como EUR o GBP
var base; 
var ratesDes;

async function init(){

    //************************** ACTIVIDAD 1 ***************************/

    // creo los desplegables
    crearListaOrigen();
    crearListaDestino();
 
    // eventos para cuando se cambie de opción en el desplegable, cambiar el símbolo
    document.getElementById("monedaOrg").addEventListener("change", simboloOrigen);
    document.getElementById("monedaDest").addEventListener("change", simboloDestino);

    // eventos para la conversión automática
    document.getElementById("monedaOrg").addEventListener("change", obtenerResultado);
    document.getElementById("monedaDest").addEventListener("change", obtenerResultado);
    document.getElementById("numero").addEventListener("change", obtenerResultado);
    document.getElementById("numero").addEventListener("input", obtenerResultado);

    obtenerResultado();
    
    //************************** ACTIVIDAD 2 ***************************/

    document.getElementById("anadir").addEventListener("click", crearFilaHistorial);

}

//************************** ACTIVIDAD 1 ***************************/

// primero solicito los datos dependiendo de la base (moneda elegida)
async function solicitarConversion() {

    // valores por defecto
    base = "USD"; 
    // obtengo el simbolo
    var simboloOr = document.getElementById("monedaOrg");  // € o ł
    var simboloDe = document.getElementById("monedaDest");

    var arrayMonedas = await obtenerArrayMonedas();

    // recorro el array para ver si coinciden los símbolos
    arrayMonedas.forEach(element => {
        // si coincide cambio la variable base para hacer la llamada con axios
        if (simboloOr.value==element[1].symbol) {
            base = element[0];
        }
        // si coincide cambio la variable rates para saber la moneda destino
        if (simboloDe.value==element[1].symbol) {
            ratesDes = element[0];
        }
    });

    try {
        const resp = await axios.get(`https://api.vatcomply.com/rates?base=${base}`); 
        return resp.data;
    } catch (err) {
        console.error("Ha habido un error en la conexión: "+err);  // genero el error en caso de fallo de conexión
    }
}

async function obtenerResultado() {
    var cantidadRate;

    // obtengo los datos de la consulta axios
    var moneda = await solicitarConversion();
    // console.log("\nObjeto moneda: ");
    // console.log(moneda);

    // Paso el objeto a array, solo pasándole los valores rates 
    var arrayMoneda = Object.entries(moneda.rates);
    // console.log("\nArray moneda: ");
    // console.log(arrayMoneda);
    
    // si coincide la moneda de destino (ratesDes) con la del elemento que recorro, guardo su cantidad en la variable 
    arrayMoneda.forEach(element => {
        // console.log(element[0]);
        if (ratesDes==element[0]) {
            cantidadRate = element[1];
        }
    });

    // obtengo la cantidad del input
    var cantidad = document.getElementById("numero").value;
    var resul = cantidad * cantidadRate;

    document.getElementById("resultado").value = resul;
}
async function solicitarMonedas() {
    try {
        const resp = await axios.get("https://api.vatcomply.com/currencies");
        return resp.data;
    } catch (err) {
        console.error("Ha habido un error en la conexión: "+err);  // genero el error en caso de ffallo de conexión
    }
}

async function obtenerArrayMonedas() {
    // obtengo los datos 
    var monedas = await solicitarMonedas();
    // Paso el objeto a array
    var arrayMonedas = Object.entries(monedas);
    return arrayMonedas;
}

async function crearListaOrigen() {

    var arrayMonedas = await obtenerArrayMonedas();

    var elemento = document.querySelector(".origen");

    for (let i = 0; i < arrayMonedas.length; i++) {
        var nodo=nuevoDesplegable(arrayMonedas[i]);
        elemento.appendChild(nodo);
        nodeToJSON.set(nodo,arrayMonedas[i]);
    }

    // AQUI LLAMAR A SÍMBOLO ORIGEN
    simboloOrigen();

}
function simboloOrigen() {

    // obtengo el @ que hay que cambiar
    var nodoCambiar = document.getElementById("coinSymbolIn");
    //console.log(nodoCambiar.textContent);

    // guardo el símbolo obtenido
    var nuevoNodo = document.getElementById("monedaOrg").value;
    //console.log(nuevoNodo);

    // cambio el nodo
    nodoCambiar.textContent = nuevoNodo;
}

async function crearListaDestino() {

    var arrayMonedas = await obtenerArrayMonedas();

    var elemento = document.querySelector(".destino");

    // comienzo desde uno para que el primero sea el dolar
    for (let i = 1; i < arrayMonedas.length; i++) {
        var nodo=nuevoDesplegable(arrayMonedas[i]);
        elemento.appendChild(nodo);
        nodeToJSON.set(nodo,arrayMonedas[i]);
    }

    // inserto el EURO antes que el primer hijo
    var nodo=nuevoDesplegable(arrayMonedas[0]);
    elemento.insertBefore(nodo, elemento.firstChild);
    nodeToJSON.set(nodo,arrayMonedas[0]);

    // AQUI LLAMAR A SÍMBOLO Destino
    simboloDestino();

}
function simboloDestino() {
    
    // obtengo el @ que hay que cambiar
    var nodoCambiar = document.getElementById("coinSymbolOut");
    //console.log(nodoCambiar.textContent);

    // guardo el símbolo obtenido
    var nuevoNodo = document.getElementById("monedaDest").value;
    //console.log(nuevoNodo);

    // cambio el nodo
    nodoCambiar.textContent = nuevoNodo;
}
function nuevoDesplegable(moneda) {
    var html = `<option value="${moneda[1].symbol}">${moneda[1].name}</option>`;
    return htmlToElement(html);
}


//************************** ACTIVIDAD 2 ***************************/

async function crearFilaHistorial() {
    //*** Fecha Conversiones (O y D) Cantidad Resultado ****/

    // div donde se creará el nuevo elemento de la tabla
    var div = document.querySelector(".historial");
    
    var resultado = document.getElementById("resultado").value; // OK
    resultado = Math.round(resultado*1000)/1000; // redondeo a 3 decimales
    var cantidadOrigen = document.getElementById("numero").value; // OK

    // Conversores de Origen y Destino  - EUR a GBP
    var convOrigen = base;
    var convDestino = ratesDes;

    // Selector Cantidad de Origen y Destino
    var sco = document.getElementById("monedaOrg").value; // OK
    var scd = document.getElementById("monedaDest").value; // OK
    
    var nodo=nuevoFila(resultado,convOrigen, convDestino, cantidadOrigen, sco, scd);
    div.insertBefore(nodo, div.firstElementChild);

    // añadir eventos justo al añadirlo
    document.querySelector(".btn-borrar").addEventListener('click', borrarFila);
    document.querySelector(".subirNota").addEventListener('click', subirFila);
    document.querySelector(".bajarNota").addEventListener('click', bajarFila);

}

function nuevoFila(resultado, convOrigen, convDestino, cantidadOrigen, sco, scd) {
    let fecha = new Date();
    let hoy =   String(fecha.getHours()).padStart(2, '0') + ':' +  
                String(fecha.getMinutes()).padStart(2, '0') + ':' + 
                String(fecha.getSeconds()).padStart(2, '0') + ' ' + 
                String(fecha.getDate()).padStart(2, '0') + '/' + 
                String(fecha.getMonth() + 1).padStart(2, '0') + '/' + 
                fecha.getFullYear();       

    var html = `<tr>
                    <td>${hoy}</td>
                    <td>${convOrigen} a ${convDestino}</td>
                    <td>${cantidadOrigen} ${sco}</td>
                    <td>${resultado} ${scd}</td>
                    <td>
                        <a><button class="btn subirNota">▲</button></a> 
                        <a><button class="btn bajarNota">▼</button></a> 
                        <a><button class="btn btn-danger btn-borrar">X</button></a>
                    </td>
                </tr>`;
    return htmlToElement(html);

}

function borrarFila() {
    var nodoBorrar = this.parentNode.parentNode.parentNode;
    nodoBorrar.parentNode.removeChild(nodoBorrar);
}
function subirFila() {
    var nodoAMover = this.parentNode.parentNode.parentNode;
    //console.log(nodoAMover.previousElementSibling); // <tr></tr>

    // compruebo que haya un elemento hermano encima
    if (nodoAMover.previousElementSibling != null) {
        nodoAMover.parentNode.insertBefore(nodoAMover, nodoAMover.previousElementSibling);
    }
}
function bajarFila() {
    var nodoAMover = this.parentNode.parentNode.parentNode;
    if (nodoAMover.nextElementSibling != null) {
        nodoAMover.parentNode.insertBefore(nodoAMover, nodoAMover.nextElementSibling.nextElementSibling);
    }
}

function htmlToElement(html) {
    var template = document.createElement("template");
    html = html.trim(); // Never return a text node of whitespace as the result 
    template.innerHTML = html;
    return template.content.firstChild;
}