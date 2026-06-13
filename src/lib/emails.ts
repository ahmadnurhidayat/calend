import { Resend } from 'resend';

let resend: Resend;

function getResend(): Resend {
    if (!resend) {
        resend = new Resend(process.env.RESEND_API_KEY);
    }
    return resend;
}

interface SendBookingEmailsParams {
    candidateName: string;
    candidateEmail: string;
    hostName: string;
    hostEmail: string;
    eventTitle: string;
    startTime: string;
    endTime: string;
    date: string;
    timezone: string;
    reason?: string;
    rescheduleUrl: string;
    teamMemberEmails?: string[];
    meetLink?: string;
}

function buildConfirmationEmail(params: SendBookingEmailsParams): string {
    const { candidateName, hostName, eventTitle, startTime, endTime, date, timezone, reason, rescheduleUrl, meetLink } = params;

    return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: #1A5D5C; color: white; padding: 24px; border-radius: 12px 12px 0 0;">
    <h1 style="margin: 0; font-size: 20px;">Booking Confirmed</h1>
  </div>
  <div style="background: #f9fafb; padding: 24px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
    <p style="color: #374151; margin: 0 0 16px;">Hi ${candidateName},</p>
    <p style="color: #374151; margin: 0 0 16px;">Your meeting has been confirmed with <strong>${hostName}</strong>.</p>
    
    <div style="background: white; padding: 16px; border-radius: 8px; border: 1px solid #e5e7eb; margin: 16px 0;">
      <p style="margin: 0 0 8px;"><strong>${eventTitle}</strong></p>
      <p style="margin: 0 0 4px; color: #6b7280;">${date} at ${startTime} - ${endTime} (${timezone})</p>
      ${reason ? `<p style="margin: 8px 0 0; color: #6b7280; font-style: italic;">${reason}</p>` : ''}
    </div>

    ${meetLink ? `<p style="margin: 16px 0;"><a href="${meetLink}" style="background: #1A5D5C; color: white; padding: 10px 20px; border-radius: 6px; text-decoration: none; display: inline-block;">Join Meeting</a></p>` : ''}
    
    <p style="margin: 16px 0 0;"><a href="${rescheduleUrl}" style="color: #1A5D5C;">Reschedule this meeting</a></p>
    
    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
    <p style="color: #9ca3af; font-size: 12px; margin: 0;">Scheduled via Calend</p>
  </div>
</body>
</html>`;
}

function buildHostEmail(params: SendBookingEmailsParams): string {
    const { hostName, candidateName, candidateEmail, eventTitle, startTime, endTime, date, timezone, reason, meetLink } = params;

    return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: #1A5D5C; color: white; padding: 24px; border-radius: 12px 12px 0 0;">
    <h1 style="margin: 0; font-size: 20px;">New Booking</h1>
  </div>
  <div style="background: #f9fafb; padding: 24px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
    <p style="color: #374151; margin: 0 0 16px;">Hi ${hostName},</p>
    <p style="color: #374151; margin: 0 0 16px;">You have a new booking from <strong>${candidateName}</strong> (${candidateEmail}).</p>
    
    <div style="background: white; padding: 16px; border-radius: 8px; border: 1px solid #e5e7eb; margin: 16px 0;">
      <p style="margin: 0 0 8px;"><strong>${eventTitle}</strong></p>
      <p style="margin: 0 0 4px; color: #6b7280;">${date} at ${startTime} - ${endTime} (${timezone})</p>
      ${reason ? `<p style="margin: 8px 0 0; color: #6b7280; font-style: italic;">"${reason}"</p>` : ''}
    </div>

    ${meetLink ? `<p style="margin: 16px 0;"><a href="${meetLink}" style="background: #1A5D5C; color: white; padding: 10px 20px; border-radius: 6px; text-decoration: none; display: inline-block;">Join Meeting</a></p>` : ''}
    
    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
    <p style="color: #9ca3af; font-size: 12px; margin: 0;">Scheduled via Calend</p>
  </div>
</body>
</html>`;
}

export async function sendBookingEmails(params: SendBookingEmailsParams): Promise<void> {
    const fromEmail = process.env.EMAIL_FROM || 'Calend <onboarding@resend.dev>';

    const promises: Promise<unknown>[] = [
        // Email to candidate
        getResend().emails.send({
            from: fromEmail,
            to: params.candidateEmail,
            subject: `Booking Confirmed: ${params.eventTitle} with ${params.hostName}`,
            html: buildConfirmationEmail(params),
        }),
        // Email to host
        getResend().emails.send({
            from: fromEmail,
            to: params.hostEmail,
            subject: `New Booking: ${params.candidateName} - ${params.eventTitle}`,
            html: buildHostEmail(params),
        }),
    ];

    // Email to team members
    if (params.teamMemberEmails && params.teamMemberEmails.length > 0) {
        for (const email of params.teamMemberEmails) {
            promises.push(
                getResend().emails.send({
                    from: fromEmail,
                    to: email,
                    subject: `Team Booking: ${params.candidateName} - ${params.eventTitle}`,
                    html: buildHostEmail(params),
                })
            );
        }
    }

    await Promise.allSettled(promises);
}
