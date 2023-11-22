const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const qs = require('qs');
const tunnel = require('tunnel');
const dotenv = require('dotenv');
const { response } = require('express');
var cors = require('cors')


dotenv.config();
console.log(`Outbound route certificate is stored at this path: ${process.env['NODE_EXTRA_CA_CERTS']}`);

const VGS_VAULT_ID=process.env.VGS_VAULT_ID;
const VGS_USERNAME=process.env.VGS_USERNAME;
const VGS_PASSWORD=process.env.VGS_PASSWORD;
const STRIPE_KEY=process.env.STRIPE_KEY;
const ADYEN_MERCHANT_ACCOUNT=process.env.ADYEN_MERCHANT_ACCOUNT;
const ADYEN_KEY=process.env.ADYEN_KEY;
const HEARTLAND_KEY=process.env.HEARTLAND_KEY;
const BASE_DOMAIN=process.env.BASE_DOMAIN;

const app = express();

app.use(cors())
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static('public'))

app.post('/tokenize', async (req, res) => {
    const payload = req.body;
    console.log("Received Request with Payload:");
    console.log(payload);
    let response = req.body;
    response.message = "Payload received on server. Echoing back request body.";
    
    res.send(response);
});


app.post('/encrypted-payment', async (req, res) => {
    console.log("!!!Encrypted Payment Incoming!!!")
    let response = await orchestratePayment(req)
    res.send({"response": response});
})

app.post('/post', async (req, res) => {
    let response = await orchestratePayment(req)
    res.send({"response": response});
});

app.get('/get_vault_id', async (req, res) => {
    res.setHeader('content-type', 'application/json')
    res.send({
        "vault_id": VGS_VAULT_ID,
    });
});

app.get('/get_stripe_payment_intent/:paymentIntent', async (req, res) => {
    let response = await getStripePaymentIntent(req.params.paymentIntent)
    res.send({"response": response});
});

let port = process.env._ && process.env._.indexOf("heroku") !== -1 ? 80 : 3000

app.listen(port, () => {
    console.log(`Server started on port ${port}`);
});

async function orchestratePayment(req) {
    const creditCardInfo = req.body;
    console.log("Received Tokenized Card Info:");
    console.log(creditCardInfo);
    let responses = [];
    switch (creditCardInfo['billing-country']) {
        case 'US':
            if(parseFloat(creditCardInfo['amount']) > 50) {
                responses.push(await postHeartlandPayment(creditCardInfo));
            }
            else if(creditCardInfo['card-number'][0] == '4') {
                responses.push(await postStripePayment(creditCardInfo))
            }
            else {
                responses.push(await postAdyenPayment(creditCardInfo))
            }
            break;
        default:
            postStripePayment(creditCardInfo);
            break;
    }
    if (!responses.length || !responses[responses.length - 1].success) {
        responses.push(await postStripePayment(creditCardInfo))
    }

    return responses;
}

function getProxyAgent() {
    const vgs_outbound_url = `${VGS_VAULT_ID}.sandbox.verygoodproxy.com`
    console.log(`Sending request through outbund Route: ${vgs_outbound_url}`);
    return tunnel.httpsOverHttps({
        proxy: {
            servername: vgs_outbound_url,
            host: vgs_outbound_url,
            port: 8443,
            proxyAuth: `${VGS_USERNAME}:${VGS_PASSWORD}`
        },
    });
}

async function postStripePayment(creditCardInfo) {
    let agent = getProxyAgent();
    let expiry = creditCardInfo['card-expiration-date'].split('/')

    let buff = new Buffer(STRIPE_KEY+":");
    let base64Auth = buff.toString('base64');

    const instance = axios.create({
        baseURL: 'https://api.stripe.com',
        headers: {
            'authorization': `Basic ${base64Auth}`,
        },
        httpsAgent: agent,
    });
    
    try {
        let pm_response = await instance.post('/v1/payment_methods', qs.stringify({
            type: 'card',
            card: {
                number: creditCardInfo['card-number'],
                cvc: creditCardInfo['card-security-code'],
                exp_month: expiry[0].trim(),
                exp_year: expiry[1].trim()
            }
        }));
        console.log(pm_response.data)

        let pi_response = await instance.post('/v1/payment_intents', qs.stringify({
            amount: 100,
            currency: 'usd',
            payment_method: pm_response.data.id,
            return_url: creditCardInfo.do_three_ds ? 'https://' + BASE_DOMAIN + '/3ds_confirm.html' : null,
            payment_method_options: {
                card: {
                    request_three_d_secure: creditCardInfo.do_three_ds ? 'any' : null
                }
            },
            confirm: true
        }));
        console.log(pi_response.data);

        return {
            success: pi_response.data.status == 'succeeded',
            id: pi_response.data.id,
            status: pi_response.data.status,
            psp: 'stripe',
            logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/ba/Stripe_Logo%2C_revised_2016.svg/1280px-Stripe_Logo%2C_revised_2016.svg.png',
            data: pi_response.data
        }
    }
    catch(error) {
        console.log('FAILURE!');
        console.log(error);
        return {
            status: 'failure',
            psp: 'stripe',
            error: error.message,
            logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/ba/Stripe_Logo%2C_revised_2016.svg/1280px-Stripe_Logo%2C_revised_2016.svg.png',
            data: error.response.data.error
        }
    }
}

async function postAdyenPayment(creditCardInfo) {
    let agent = getProxyAgent();
    let expiry = creditCardInfo['card-expiration-date'].split('/')

    const instance = axios.create({
        baseURL: 'https://checkout-test.adyen.com',
        headers: {
            'X-API-key': ADYEN_KEY,
        },
        httpsAgent: agent,
    });
    
    try {
        let response = await instance.post('/v68/payments',{
            "amount":{
                "currency":"USD",
                "value":1000
            },
            "reference":"12345678",
            "paymentMethod":{
             "type":"scheme",
             "number": creditCardInfo['card-number'],
             "expiryMonth": expiry[0].trim(),
             "expiryYear": '20'+ expiry[1].trim(),
             "cvc": "737",
             "holderName": creditCardInfo['cardholder-name']
            },
            "additionalData" : {
                "allow3DS2" : true
            },
            "channel": "web",
            "merchantAccount": ADYEN_MERCHANT_ACCOUNT
        });
        console.log(response.data)

        return {
            success: response.data.resultCode == 'Authorised',
            id: response.data.pspReference,
            status: response.data.resultCode,
            psp: 'adyen',
            logo: 'https://adyen.getbynder.com/transform/042b7c58-5dbe-486a-aed8-30136a44a080/brandguidelines-logo2',
            data: response.data
        }
    }
    catch(error) {
        console.log('FAILURE!');
        console.log(error);
        return {
            status: 'failure',
            psp: 'adyen',
            error: error.message,
            logo: 'https://adyen.getbynder.com/transform/042b7c58-5dbe-486a-aed8-30136a44a080/brandguidelines-logo2',
        }
    }
}

async function postHeartlandPayment(creditCardInfo)
{
    let agent = getProxyAgent();
    let expiry = creditCardInfo['card-expiration-date'].split('/')

    const instance = axios.create({
        baseURL: 'https://posgateway.cert.secureexchange.net/Hps.Exchange.PosGateway/PosGatewayService.asmx?wsdl',
        headers: {
            'content-type': 'text/xml',
        },
        httpsAgent: agent,
    });
    
    let name = creditCardInfo['cardholder-name'].split(' ');
    
    try {
        let response = await instance.post('/Hps.Exchange.PosGateway/PosGatewayService.asmx?wsdl',`<?xml version="1.0" encoding="UTF-8"?>
        <SOAP:Envelope xmlns:SOAP="http://schemas.xmlsoap.org/soap/envelope/"
            xmlns:hps="http://Hps.Exchange.PosGateway">
            <SOAP:Body>
                <hps:PosRequest>
                    <hps:Ver1.0>
                        <hps:Header>
                            <hps:SecretAPIKey>${HEARTLAND_KEY}</hps:SecretAPIKey>
                        </hps:Header>
                        <hps:Transaction>
                            <hps:CreditSale>
                                <hps:Block1>
                                    <hps:Amt>1.00</hps:Amt>
                                    <hps:AllowDup>Y</hps:AllowDup>
                                    <hps:CardHolderData>
                                        <hps:CardHolderFirstName>${name.length ? name[0]: ''}</hps:CardHolderFirstName>
                                        <hps:CardHolderLastName>${name.length > 1 ? name[1] : ''}</hps:CardHolderLastName>
                                        <hps:CardHolderAddr>456 My Street</hps:CardHolderAddr>
                                        <hps:CardHolderCity>Ottawa</hps:CardHolderCity>
                                        <hps:CardHolderState>ON</hps:CardHolderState>
                                        <hps:CardHolderZip>K1C2N6</hps:CardHolderZip>
                                    </hps:CardHolderData>
                                    <hps:AdditionalTxnFields>
                                        <hps:Description>Store Purchase</hps:Description>
                                        <hps:InvoiceNbr>1</hps:InvoiceNbr>
                                    </hps:AdditionalTxnFields>
                                    <hps:CardData>
                                        <hps:ManualEntry>
                                            <hps:CardNbr>${creditCardInfo['card-number']}</hps:CardNbr>
                                            <hps:ExpMonth>${expiry[0]}</hps:ExpMonth>
                                            <hps:ExpYear>20${expiry[1].trim()}</hps:ExpYear>
                                            <hps:CVV2>${creditCardInfo['card-security-code']}</hps:CVV2>
                                            <hps:CardPresent>N</hps:CardPresent>
                                            <hps:ReaderPresent>N</hps:ReaderPresent>
                                        </hps:ManualEntry>
                                        <hps:TokenRequest>N</hps:TokenRequest>
                                    </hps:CardData>
                                </hps:Block1>
                            </hps:CreditSale>
                        </hps:Transaction>
                    </hps:Ver1.0>
                </hps:PosRequest>
            </SOAP:Body>
        </SOAP:Envelope>`
        );
        console.log(response.data)

        return {
            success: !!response.data.substring('<GatewayRspMsg>Success</GatewayRspMsg>'),
            id: response.data.pspReference,
            status: response.data.resultCode,
            psp: 'heartland',
            logo: 'https://images.expertmarket.co.uk/wp-content/uploads/sites/2/2020/03/heartland-payment-systems-logo.jpg',
            data: response.data
        }
    }
    catch(error) {
        console.log('FAILURE!');
        console.log(error);
        return {
            status: 'failure',
            psp: 'heartland',
            error: error.message,
            logo: 'https://images.expertmarket.co.uk/wp-content/uploads/sites/2/2020/03/heartland-payment-systems-logo.jpg',
        }
    }
}

async function getStripePaymentIntent(paymentIntent)
{
    let buff = new Buffer(STRIPE_KEY+":");
    let base64Auth = buff.toString('base64');
    const instance = axios.create({
        baseURL: 'https://api.stripe.com',
        headers: {
            'authorization': `Basic ${base64Auth}`,
        },
    });
    
    try {
        let response = await instance.get('/v1/payment_intents/'+paymentIntent);
        console.log(response.data)
        return {
            status: response.data.status == 'succeeded',
            psp: 'stripe',
            logo: 'https://images.expertmarket.co.uk/wp-content/uploads/sites/2/2020/03/heartland-payment-systems-logo.jpg',
            data: response.data
        }
    }
    catch(error) {
        console.log('FAILURE!');
        console.log(error);
        return {
            status: 'failure',
            psp: 'stripe',
            error: error.message,
            logo: 'https://images.expertmarket.co.uk/wp-content/uploads/sites/2/2020/03/heartland-payment-systems-logo.jpg',
        }
    }
}