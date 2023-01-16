# This lines instructs the system to trust the certificate required to send requests through VGS.
# This environment variable currently needs to be set before the nodejs process starts
export NODE_EXTRA_CA_CERTS=$(pwd)/outbound-route-sandbox.pem

# Start server
npm start