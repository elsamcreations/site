import { fetch } from './utils.js'

const auth = ['038493e42c29341a8eae9bc17153dfae', process.env.MAILJET_PASSWORD]
const authorization = `Basic ${Buffer.from(auth.join(':')).toString('base64')}`
const headers = { 'content-type': 'application/json', authorization }

export async function notify({ subject, text }) {
  const email = {
    CustomID: 'AdminNotify',
    TextPart: text,
    Subject: subject,
    From: { Email: 'hello@elsamcreations.com', Name: 'Elsa' },
    To: [
      { Email: 'morandelsa@yahoo.fr', Name: 'Elsa' },
      { Email: 'le.mikmac@gmail.com', Name: 'Clement' },
    ],
  }
  const body = JSON.stringify({ Messages: [ email ] })
  return fetch('https://api.mailjet.com/v3.1/send', { headers, body })
}
