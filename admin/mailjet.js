import { fetch } from './utils.js'

const auth = ['038493e42c29341a8eae9bc17153dfae', process.env.MAILJET_PASSWORD]
const authorization = `Basic ${Buffer.from(auth.join(':')).toString('base64')}`

// TODO: generate images for the sheet instead of just names
const formatOrder = (order) => `
#${order.id}

- Sheet: ${order.sheet.name}
- Item: ${order.item}
- Size: ${order.size}
- Instructions:
  ${order.instructions
    .split('\n')
    .map((n) => `  ${n}`)
    .join('\n')}`

export async function sendMail(CustomID, { subject, content, to }) {
  const email = {
    CustomID,
    HTMLPart: content,
    Subject: subject,
    From: { Email: 'hello@elsamcreations.com', Name: 'Elsa' },
    To: (Array.isArray(to) ? to : [to]).map((Email) => ({ Email })),
  }
  const res = await fetch('https://api.mailjet.com/v3.1/send', {
    headers: { 'content-type': 'application/json', authorization },
    body: JSON.stringify({ Messages: [email] }),
  })
}

// CONFIRM
const A = (href, text = href) =>
  `<a href="${href}" style="color: #007BFF; cursor: pointer; text-decoration: underline">${text}</a>`
const confirmTemplate = (order) => `<pre>
Hey it's Elsa, Thanks for your order, here are my notes:

${formatOrder(order)}

Click ${A(
  `https://api.eslamcreations.com/confirm?id=${order.id}`,
  'this confirmation link',
)} to request a quote.

If you have any question or additionnal demands, just reply to this email, I read them.

<i>- Talk to you soon, ElsaM.</i>


PS: if the link doesn't work, copy / paste ${A(`https://api.eslamcreations.com/confirm?id=${order.id}`)}
</pre>`

const confirmTemplateFr = (order) => `<pre>
Salut, c'est Elsa, Merci pour la commande, voici ce que j'ai noter:

${formatOrder(order)}

Clique ${A(
  `https://api.eslamcreations.com/confirm?id=${order.id}`,
  'ce lien de confirmation',
)} pour que je t'envois un devis.

Si tu a d'autres questions / demandes, réponds simplement a cet email :-)

<i>- A tres vite, ElsaM.</i>



PS: si le lien marche pas, copie / colle ${A(`https://api.eslamcreations.com/confirm?id=${order.id}`)}
</pre>`

export const submitOrder = async (order) =>
  sendMail('OrderSubmitted', {
    subject:
      order.lang === 'FR'
        ? `Give a sheet order #${order.id}`
        : `Give a sheet commande #${order.id}`,
    content:
      order.lang === 'FR' ? confirmTemplateFr(order) : confirmTemplate(order),
    to: [order.email],
  })

// NOTIFY
const notifyTemplate = (order) => `<pre>
Nouvelle demande de devis:

${formatOrder(order)}

Envoyer par: <a href="mailto:${order.email}">${order.email}</a> ${
  order.lang === 'FR' ? 'en francais' : 'en anglais'
}

</pre>`

export const confirmQuote = async (order) =>
  sendMail('ConfirmedQuote', {
    subject: `Demande de devis: ${order.id}`,
    content: notifyTemplate(order),
    to: ['hello@elsamcreations.com'],
  })
