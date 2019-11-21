const sdk = require('aws-iot-device-sdk');
const thingShadow = sdk.thingShadow;

exports.handler = async (event) => {
    try {
        if (event['name'] === null || event['name'] === undefined) {
            return {
                statusCode: 400,
                body: 'missing parameters',
                errors: {
                    name: ['IoT Device Name("name") is required']
                },
                event: event
            };
        }
        const thingShadows = thingShadow({
            keyPath: './certs/private.pem.key',
            certPath: './certs/certificate.pem.crt',
            caPath: './certs/root-CA.crt',
            clientId: event.name,
            region: '[AWS 지역]',
            // protocol: 'mqtts',
            host: '[AWS IoT 호스트 주소]',
        });
        thingShadows.on('status', (thingName, stat, clientToken, stateObject) => {
            thingShadows.end();
        });
        let data = await new Promise((resolve, reject) => {
            thingShadows.on('connect', () => {
                thingShadows.register(event.name, {
                    ignoreDeltas: false,
                    persistentSubscribe: false
                }, () => {
                    let result = thingShadows.update(event.name, {
                        "state": {
                            "reported": {
                                "temperature": event.temp,
                                "humidity": event.humid,
                                "pm025": event.pm25,
                                "pm100": event.pm10
                            }
                        }

                    });
                    if (result !== null) {
                        if (process.env.NODE_ENV === 'devel') {
                            console.log({
                                statusCode: 200,
                                body: 'Successful updated'
                            });
                        }
                        resolve({
                            statusCode: 200,
                            body: 'Successful updated'
                        });
                    } else {
                        reject([
                            '"' + event.name + '" couldn\'t update!'
                        ]);
                    }
                });
            });
        });
        return data;
    } catch (err) {
        if (process.env.NODE_ENV === 'devel') {
            console.error(err);
        }
        return {
            statusCode: 500,
            body: 'Service Unavaiable!',
            non_field_erros: err
        }
    }
};


if (process.env.NODE_ENV === 'devel') {
    exports.handler({
        "name": "AirSensor00000000",
        "temp": 56,
        "humid": 30,
        "pm25": 200,
        "pm10": 50
    });
}
