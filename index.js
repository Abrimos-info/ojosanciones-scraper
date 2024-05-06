const puppeteer = require("puppeteer");
const fs = require('fs');

let records = {};
let total = 0;

async function run() {
    let baseURL = 'https://directoriosancionados.apps.funcionpublica.gob.mx/';
    let args = ['--no-sandbox'];

    var browser = await puppeteer.launch({ headless: true, args: args });
    var page = await browser.newPage();
    // console.log('page.goto')
    await page.goto(baseURL, { waitUntil: 'networkidle0' });

    // Select Proveedor y Contratista filter
    // console.log('page.select')
    await page.select('#color', '2');
    // console.log('button click')
    await page.$eval('body > app-root > div > app-body > form > div > div:nth-child(3) > div.col-lg-10 > body-seleccion-prov > form > div:nth-child(1) > button.waves-light.btn-primary.btn', button => button.click() );


    // capture background responses:
    page.on('response', async (response) => {
        let originalRequest = await response.request();
        let responseData = {
            url: originalRequest.url(),
            method: originalRequest.method(),
            headers: originalRequest.headers(),
            body: originalRequest.postData(),
        }
        let url = await response.url();

        if(url.match(/api/) && responseData.method == 'POST') {
            let parsedBody = JSON.parse(responseData.body);
            if(parsedBody.operationName == 'getExpXDependencias') {
                // console.log('Loading full list...');
                let mainList = await response.json();
                collectRecords(mainList);

                let keys = Object.keys(records);
                for(let i=0; i<keys.length; i++) {
                    let record = records[keys[i]];
                    // console.log('fetching', record.numero_expediente, record.rfc, record.nombre_razon_social);
                    let res = await fetch("https://dgti-ees-i-particulares-sancionados-api-nv.apps.funcionpublica.gob.mx/", {
                      "headers": {
                        "accept": "application/json, text/plain, */*",
                        "accept-language": "en-US,en;q=0.9",
                        "content-type": "application/json",
                        "sec-ch-ua": "\"Not A(Brand\";v=\"99\", \"Google Chrome\";v=\"121\", \"Chromium\";v=\"121\"",
                        "sec-ch-ua-mobile": "?0",
                        "sec-ch-ua-platform": "\"Linux\"",
                        "sec-fetch-dest": "empty",
                        "sec-fetch-mode": "cors",
                        "sec-fetch-site": "same-site",
                        "Referer": "https://directoriosancionados.apps.funcionpublica.gob.mx/"
                      },
                      "body": "{\"operationName\":\"getExpediente\",\"variables\":{\"filtros\":{\"numero_expediente\":\"" + record.numero_expediente + "\"" + ((record.rfc != null)? ",\"rfc\":\"" + record.rfc + "\"" : "") + "}},\"query\":\"query getExpediente($filtros: FiltrosInput!) {\\n  results(filtros: $filtros) {\\n    numero_expediente\\n    numexpediente_corto\\n    rfc\\n    nombre_razon_social\\n    institucion_dependencia {\\n      nombre\\n    }\\n    fecha_notificacion\\n    multa {\\n      monto\\n      monto_cf\\n    }\\n    plazo {\\n      fecha_inicial\\n      fecha_final\\n      plazo_inha\\n    }\\n    observaciones\\n    objeto_social\\n    leyes_infringidas\\n    causa_motivo_hechos\\n    autoridad_sancionadora\\n    fecha_dof\\n    responsable {\\n      nombres_resp\\n      primer_apellido_resp\\n      segundo_apellido_resp\\n      cargo_resp\\n      telefono_resp\\n      email_resp\\n    }\\n    telefono\\n  }\\n}\"}",
                      "method": "POST"
                    });
                    // console.log('getting json...');
                    let resJson = await res.json();
                    collectItem(resJson);
                    // console.log('waiting timeout...');
                    await new Promise(r => setTimeout(r, 500))
                }
            }

            await browser.close();
        }
    })
}

run();

function collectRecords(list) {
    if(list.hasOwnProperty('data') && list.data.hasOwnProperty('results') && list.data.results.length > 0) {
        total = list.data.results.length;
        // console.log('Found', total, 'records.')
        list.data.results.map( r => {
            if(r.hasOwnProperty('numero_expediente')) {
                if(!records.hasOwnProperty(r.numero_expediente)) records[r.numero_expediente] = r;
                records[r.numero_expediente].detalle = [];
            }
        } );
    }
}

function collectItem(item) {
    if(item.hasOwnProperty('data') && item.data.hasOwnProperty('results') && item.data.results.length > 0) {
        let itemData = item.data.results;
        itemData.map( item => {
            records[item.numero_expediente].detalle.push(item);
            // console.log(records[item.numero_expediente]);
        } );

        writeToFile(records[itemData[0].numero_expediente]);
    }
}

function writeToFile(data, fileName='') {
    let fileToWrite = 'data.json';
    if(fileName) fileToWrite = fileName;

    if( Object.keys(data).length > 1 )
        fs.appendFileSync('./data/' + fileToWrite, JSON.stringify(data) + "\n");
}
