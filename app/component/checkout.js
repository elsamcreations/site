const script = document.createElement('script')
script.src = 'https://js.stripe.com/v3'
script.onerror = (ev) => {
  console.error(ev, Error('Failed to load stripe'))
}

script.onload = async () => {
  let stripe = Stripe('pk_test_51IinC4DDpZZcA4TdpugUkXBcmtRRtVdJzNS1848tKPzfwOSKtk38oERfhRs2O4KEDBAfLZcuphK7aUQwXcQOMj2J00UTM90XhD')

  function setStripe(id, lineItems) {
    document.getElementById(id).addEventListener('click', function () {
      stripe.redirectToCheckout({
        lineItems: lineItems,
        mode: 'payment',
        successUrl: 'https://traitedelutherie.com/success',
        cancelUrl: 'https://traitedelutherie.com/canceled',
        customerEmail: 'patrick@gmail.com',
      })
      .then(function (result) {
        if (result.error) {
          let displayError = document.getElementById('error-message')
          displayError.textContent = result.error.message
        }
      })
    })
  }

  setStripe('checkout-button-230', [
    {price: 'price_1IinlvDDpZZcA4TdpJ9isAfZ', quantity: 1},
    {price: 'price_1IuLNQDDpZZcA4TdeujbHChp', quantity: 2},
  ])

  setStripe('checkout-button-215', [
    {price: 'price_1IinlvDDpZZcA4TdpJ9isAfZ', quantity: 1},
    //{sku: 'sku_EnclvkJ8hiu8Iz', quantity: 1},
  ])
}

document.body.append(script)
