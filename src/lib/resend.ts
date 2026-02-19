import { Resend } from 'resend';

export const resend = new Resend(process.env.RESEND_API_KEY || '');

export async function sendWelcomeEmail(email: string, name: string) {
  return resend.emails.send({
    from: 'FishSpot <noreply@fishspot.fr>',
    to: email,
    subject: 'Bienvenue sur FishSpot !',
    html: `
      <h1>Bienvenue ${name} !</h1>
      <p>Merci de rejoindre la communauté FishSpot.</p>
      <p>Découvrez les meilleurs spots de pêche près de chez vous.</p>
    `,
  });
}

export async function sendRegulationAlert(email: string, alert: { title: string; description: string; department: string }) {
  return resend.emails.send({
    from: 'FishSpot Alertes <alertes@fishspot.fr>',
    to: email,
    subject: `Alerte réglementation - ${alert.department}`,
    html: `
      <h2>${alert.title}</h2>
      <p>${alert.description}</p>
      <p>Département : ${alert.department}</p>
    `,
  });
}
