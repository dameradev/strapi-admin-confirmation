# Strapi plugin invitation-email

Adds automatic emails sent when inviting new users. The email is being sent when clicking "Invite user" button after filling the new user form.

## Installation

Requires strapi `>= 4.4.6`

In the root of the strapi project run:

```
npm install @chcaa/strapi-invitation-email
```

## Configuration

### Required

Specify `email` plugin config in config/plugin.js file. `nodemailer` needs to be set as the default provider, and properties of an email account for outgoing emails must specified.  
Example of the configuration using environment variables:

```js
  email: {
    config: {
      provider: "nodemailer",
      providerOptions: {
        host: env("SMTP_HOST", 'smtp.uni.au.dk'),
        port: env("SMTP_PORT", 25),
        auth: {
          user: env("SMTP_USERNAME"),
          pass: env("SMTP_PASSWORD"),
        },
      },
      settings: {
        defaultFrom: env("EMAIL_DEFAULT_FROM"),
        defaultReplyTo: env("EMAIL_DEFAULT_REPLY_TO"),
      },
    },
  },
```

### Optional

The email template used for inviting a new user can be specified by passing path of the html file in 'invitation-email' config in config/plugin.js file. The template has access to the user object (`USER`) and invitation link (`URL`).

Config example:

```js
"invitation-email": {
    config: {
      "email-template": "assets/InvitationEmailTemplate.html",
    },
  },
```

Template example:

```html
<p>Hi <%= USER.firstname %>!</p>
<p>
  You've been invited to a Strapi administrator panel. Please click on the link
  below to create your account.
</p>
<p><%= URL %></p>
<p>Thanks.</p>
```
