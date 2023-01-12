const form = window.VGSCollect.create('tntfcgkllzg', 'sandbox', (state) => {});

const css = {
  "font-size": "20px",
  "color": "#1f25deff",
  "font-family": "\"Arial\", sans-serif",
  "&::placeholder": {
    "color": "#C8D0DB"
  },
  "font-weight": "100"
};

form.field('#cardholder-name', {
  name: "cardholder-name",
  type: "text",
  placeholder: "Cardholder name",
  validations: ["required"],
  autoComplete: "cc-name",
  css
});
form.field('#card-number', {
  name: "card-number",
  type: "card-number",
  placeholder: "0000 0000 0000 0000",
  validations: ["required","validCardNumber"],
  showCardIcon: "true",
  autoComplete: "cc-number",
  css
});
form.field('#card-expiration-date', {
  name: "card-expiration-date",
  type: "card-expiration-date",
  placeholder: "MM / YY",
  validations: ["required","validCardExpirationDate"],
  autoComplete: "cc-exp",
  css
});
form.field('#card-security-code', {
  name: "card-security-code",
  type: "card-security-code",
  placeholder: "CVV",
  validations: ["required","validCardSecurityCode"],
  autoComplete: "cc-csc",
  css
});

document.addEventListener('submit', (e) => {
  e.preventDefault();
  form.submit('/post', { method: 'POST'}, (status, data) => { 
    document.getElementById('response').innerText = JSON.stringify(data.json ?? data, null, ' ');
  });
});