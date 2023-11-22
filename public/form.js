
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

  let THREE_DS_WINDOW = null;
  let THREE_DS_WRAPPER = document.getElementById('three-ds-wrapper');
  
  form.field('#cardholder-name', {
    name: "cardholder-name",
    type: "text",
    placeholder: "Cardholder name",
    validations: ["required"],
    autoComplete: "cc-name",
    css,
    tokenization: false
  });
  form.field('#card-number', {
    name: "card-number",
    type: "card-number",
    placeholder: "0000 0000 0000 0000",
    validations: ["required","validCardNumber"],
    showCardIcon: "true",
    autoComplete: "cc-number",
    css,
    tokenization: {
      format: 'FPE_SIX_T_FOUR',
      storage: 'PERSISTENT'
    }
  });
  form.field('#card-expiration-date', {
    name: "card-expiration-date",
    type: "card-expiration-date",
    placeholder: "MM / YY",
    validations: ["required"],
    autoComplete: "cc-exp",
    css,
    tokenization: false
  });
  form.field('#card-security-code', {
    name: "card-security-code",
    type: "card-security-code",
    placeholder: "CVV",
    validations: ["required","validCardSecurityCode"],
    autoComplete: "cc-csc",
    css,
    tokenization: {
      storage: 'VOLATILE'
    }
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
    defaultValue: "US",
    css,
    tokenization: false
  });
  form.field('#billing-state', {
    name: "billing-state",
    type: "text",
    placeholder: "Region",
    validations: [],
    autoComplete: "billing-state",
    defaultValue: "Colorado",
    css,
    tokenization: false
  });
  form.field('#billing-city', {
    name: "billing-city",
    type: "text",
    placeholder: "City",
    validations: [],
    autoComplete: "billing-city",
    defaultValue: "Denver",
    css,
    tokenization: false
  });
  form.field('#billing-address', {
    name: "billing-address",
    type: "text",
    placeholder: "Address",
    validations: [],
    autoComplete: "billing-address",
    defaultValue: "123 Main St.",
    css,
    tokenization: false
  });
  form.field('#amount', {
    name: "amount",
    type: "text",
    placeholder: "0.00",
    validations: [],
    autoComplete: "amount",
    defaultValue: "12.00",
    css,
    tokenization: false
  });
  form.field('#do_three_ds', {
    name: "do_three_ds",
    type: "checkbox",
    css,
    tokenization: false
  });
  // Create a hidden form field
  form.field('#vgs-session-id', {
    name: "vgs-session-id",
    type: "text",
    autoComplete: "email",
    css: {display: 'none'},
    // Provide your own trace ID value here...
    defaultValue: "70593",
    tokenization: false
  });

  function submitForm(form) {
    form.setRouteId('')
    let logoWrapperEl = document.getElementById('logo-wrapper');
    let logoEl = document.getElementById('logo');
    let responseEl = document.getElementById('response');
    let loadingEl =  document.getElementById('loading');
    responseEl.innerText = '';
    logoWrapperEl.classList.add('d-none')
    loadingEl.classList.remove('d-none')

    if(THREE_DS_WRAPPER.children.length) {
      THREE_DS_WRAPPER.children[0].remove()
    }

    form.submit('/post', { method: 'POST'}, (status, data) => { 
      loadingEl.classList.add('d-none');
      logoEl.src = data.response[ data.response.length - 1].logo;
      logoWrapperEl.classList.remove('d-none');

      if(data.response[0].data.next_action && data.response[0].data.next_action.redirect_to_url) {
        THREE_DS_WRAPPER.classList.remove('d-none');
        var iframe = document.createElement('iframe');
        iframe.src = data.response[0].data.next_action.redirect_to_url.url;
        THREE_DS_WRAPPER.appendChild(iframe);
        THREE_DS_WINDOW = iframe;
      }
      else {
        responseEl.innerText = JSON.stringify(data.json ?? data, null, ' ');
      }
    }, function(errors) {
      loadingEl.classList.add('d-none')
    });
  }

  function tokenizeForm(form) {
    form.setRouteId('9eb3a6dc-ce35-4faf-8931-d9f907ad9ce6')
    let logoWrapperEl = document.getElementById('logo-wrapper');
    let logoEl = document.getElementById('logo');
    let responseEl = document.getElementById('response');
    let loadingEl =  document.getElementById('loading');
    responseEl.innerText = '';
    logoWrapperEl.classList.add('d-none')
    loadingEl.classList.remove('d-none')
    form.tokenize(function(status, response) {
      loadingEl.classList.add('d-none');
      responseEl.innerText = JSON.stringify(response, null, ' ');
    }, function(errors) {
      console.log(errors);
      loadingEl.classList.add('d-none');
    });
  }

  async function submitEncryptedPayment() {
    let logoWrapperEl = document.getElementById('processed-by');
    let logoEl = document.getElementById('logo');
    let responseEl = document.getElementById('response');
    let loadingEl =  document.getElementById('loading');
    responseEl.innerText = '';
    logoWrapperEl.classList.add('d-none')
    loadingEl.classList.remove('d-none')
    let dummy_encrypted_payload = "aNvLG7hRG27RytS3ZKHcHIfR1De0JeMmOURZC4u2T27LLsqyH5Bwb9+oIoaZuX6j+tIPfOX3/nHc6wY1iFBm9738inJLXtgr+k17S8DYnJ+ych9amwFKPyZTCZ/ozXR0Ar1adZ8ZVWSHaUsN+FCEHYmx9/NME0AYP08vLGWnfjAEnrQWp4TIsXaynh9yYM0aNcJMxRltastnzsA4W7beYH2TBm0amu9xl1h10qV6M9WYoqK9skcJbHO38DsPPeuLdJ2qbHM5eJGX4WTdLLisY4HBfWu1IpnHSX2zFpm4qIlraas/RQwx9C3sZdRTfftXh8AK5XERdYmPYvbGyTzB2aNylABJ+QDUrN8JmbDMRjR4rn3vSrdmjivBtJYj5CrIrCeB0XTsDlLftvg7LSw12NxRBFi1SOJa8pl6heq5+IjNiC6xUvQEnDHG0odPyNHDLuHzc6nYolpJTmW1TRE6cg5ztY7zv8b0r5x2pc+hoRl3oxgDjEcKj3RakCjew/pIG48dkgk/t9Z8Tm2ZvFkL2n0FZj/7AhXUBbyg11lFyE990kjFy37qGFxp/OueJTQJ1vedUSDFllOlGUyaBnsXhQssrNRA9fIMMAKKC/X0umhoDhFZ7xqcMbOKq4XDlWcVdMXhYxPd+aUjc8yPgQI7Ph+rHKxgV8Y+U6xrIZ3YbKs=";
    let encrypted_payment = await axios.post(`https://${APP_CONFIG.vault_id}.sandbox.verygoodproxy.com/amazon-payment`, dummy_encrypted_payload)
    let data = encrypted_payment.data
    loadingEl.classList.add('d-none');
    logoEl.src = data.response[ data.response.length - 1].logo;
    logoWrapperEl.classList.remove('d-none')
    responseEl.innerText = JSON.stringify(data.json ?? data, null, ' ');
  }
  
  document.getElementById('pay').addEventListener('click', (e) => {
    e.preventDefault();
    submitForm(form);
  });
  
  document.getElementById('tokenize').addEventListener('click', (e) => {
    e.preventDefault();
    tokenizeForm(form);
  });
  
  async function onStripe3DSComplete(pi) {
    // Hide the 3DS UI
    let responseEl = document.getElementById('response');
    THREE_DS_WINDOW.remove();
    THREE_DS_WRAPPER.classList.add('d-none');
    let three_ds_response = (await axios.get(`/get_stripe_payment_intent/${pi}`)).data;
    responseEl.innerText = JSON.stringify(three_ds_response, null, ' '); 
  }

  window.addEventListener('message', async function(ev) {
    if ((typeof ev.data) == 'string' && ev.data.startsWith('3DS-')) {
      let pi = ev.data.split('3DS-')[1];
      await onStripe3DSComplete(pi);
    }
  }, false);


}
setUpApp()