
async function setUpApp() {
  const APP_CONFIG = (await axios.get('/get_vault_id')).data;

  const form = window.VGSCollect.create(APP_CONFIG.vault_id, 'sandbox', (state) => {});
  const css = {
    "vertical-align": "middle",
    "white-space": "normal",
    "background": "none",
    "font-family": "sofia, arial, sans-serif",
    "font-size": "16px",
    "color": "rgb(34, 25, 36)",
    "line-height": "normal",
    "padding": "0px 1em",
    "box-sizing": "border-box",
    "&::placeholder": {
      "color": "#6A6A6A"
    },
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
    validations: ["required"],
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
  form.field('#billing-country', {
    name: "billing-country",
    type: "dropdown",
    placeholder:"Country",
    options: [
        {value: 'CA', text: 'Canada'},
        {value: 'US', text: 'United States'}
    ],
    validations: ["required"],
    css
  });
  form.field('#billing-state', {
    name: "billing-state",
    type: "text",
    placeholder: "Region",
    validations: [],
    autoComplete: "billing-state",
    css
  });
  form.field('#billing-city', {
    name: "billing-city",
    type: "text",
    placeholder: "City",
    validations: [],
    autoComplete: "billing-city",
    css
  });
  form.field('#billing-address', {
    name: "billing-address",
    type: "text",
    placeholder: "Address",
    validations: [],
    autoComplete: "billing-address",
    css
  });
  form.field('#amount', {
    name: "amount",
    type: "text",
    placeholder: "0.00",
    validations: [],
    autoComplete: "amount",
    css
  });
  // Create a hidden form field
  form.field('#vgs-session-id', {
    name: "vgs-session-id",
    type: "text",
    autoComplete: "email",
    css: {display: 'none'},
    // Provide your own trace ID value here...
    defaultValue: "70593"
  });

  function submitForm(form) {
    let logoWrapperEl = document.getElementById('logo-wrapper');
    let logoEl = document.getElementById('logo');
    let responseEl = document.getElementById('response');
    let loadingEl =  document.getElementById('loading');
    responseEl.innerText = '';
    logoWrapperEl.classList.add('d-none')
    loadingEl.classList.remove('d-none')
    form.submit('/post', { method: 'POST'}, (status, data) => { 
      loadingEl.classList.add('d-none');
      logoEl.src = data.response[ data.response.length - 1].logo;
      logoWrapperEl.classList.remove('d-none')
      responseEl.innerText = JSON.stringify(data.json ?? data, null, ' ');
    }, function(errors) {
      loadingEl.classList.add('d-none')
    });
  }
  
  document.getElementById('pay').addEventListener('click', (e) => {
    e.preventDefault();
    submitForm(form);
  });
  
}
setUpApp()