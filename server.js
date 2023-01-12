const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const qs = require('qs');
const tunnel = require('tunnel');
process.env['NODE_EXTRA_CA_CERTS'] = '/Users/travis.mottershead/src/demo/outbound-route-sandbox.pem';

VGS_USERNAME="USmNPcPpmbnrEiRTz6m8rhQc";
VGS_PASSWORD="b542baf5-d6d3-4b68-b492-710b4791c720";

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.post('/post', async (req, res) => {
    const creditCardInfo = req.body;
    console.log("Received Tokenized Card Info:");
    console.log(creditCardInfo);
    let response = "Credit card information received"
    
    let agent = getProxyAgent();
    response = await postStripePayment(creditCardInfo, agent)

    res.send({"response": response});
});

app.listen(3000, () => {
    console.log('Server started on port 3000');
});

function getProxyAgent() {
    return tunnel.httpsOverHttps({
        proxy: {
            servername: 'tntfcgkllzg.sandbox.verygoodproxy.com',
            host: 'tntfcgkllzg.sandbox.verygoodproxy.com',
            port: 8443,
            proxyAuth: `${VGS_USERNAME}:${VGS_PASSWORD}`
        },
    });
}

async function postStripePayment(creditCardInfo, agent) {
    let expiry = creditCardInfo['card-expiration-date'].split('/')

    const instance = axios.create({
        baseURL: 'https://api.stripe.com',
        headers: {
            'authorization': 'Basic c2tfdGVzdF81MUxyczZDSzZvcGpVZ2VTbUZIUmVYMTRlQk1jYm9mQ0pyVU9pc0dUQzdBU3BrZkZNcUQ2RXlzYnM4M3FCQzEyWVpFclYzbnYxUGc0VVR5OVdSaFBSVlVwUTAwbzdjVXJWOEk6',
        },
        httpsAgent: agent,
    });
    
    try {
        let response = await instance.post('/v1/charges', qs.stringify({
            amount: '100',
            currency: 'usd',
            description: 'Example Stripe Charge',
            card: {
                number: creditCardInfo['card-number'],
                cvc: creditCardInfo['card-security-code'],
                exp_month: expiry[0].trim(),
                exp_year: expiry[1].trim(),
                name: creditCardInfo['cardholder-name']
            }
        }));
        console.log(response.data)
        return {
            id: response.data.id,
            status: response.data.status,
            psp: 'stripe'
        }
    }
    catch(error) {
        console.log('FAILURE!');
        console.log(error);
        return {
            status: 'failure',
            error: error.message
        }
    }
}
