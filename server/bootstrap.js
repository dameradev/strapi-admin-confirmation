"use strict";

const { getAbsoluteAdminUrl } = require("@strapi/utils");
const fs = require("fs");

module.exports = async ({ strapi }) => {
  const pluginStore = strapi.store({
    type: "plugin",
    name: "users-permissions",
  });
  const emailTemplate =
    strapi.plugin("invitation-email").config("email-template") ||
    `${__dirname}/defaultEmailTemplate.html`;

  await initEmails(pluginStore, emailTemplate);

  // bootstrap phase
  strapi.db.lifecycles.subscribe({
    models: ["admin::user"],

    async afterCreate({ result }) {
      // Send an invitation email when a new user is created
      // and the registration link is available
      const newUser = result;
      if (newUser.registrationToken)
        sendInvitationEmail(strapi, pluginStore, newUser);
    },
  });
};

async function initEmails(pluginStore, emailTemplate) {
  const value = (await pluginStore.get({ key: "email" })) || {};
  const { err, html } = await readHtmlTemplate(emailTemplate);
  if (err) {
    throw err;
  }
  value.send_magic_link_invite = {
    display: "Email.template.send_magic_link_invite",
    icon: "magic",
    options: {
      response_email: "",
      object:
        "Your organization has been invited to join the Platform for Erasmus Projects",
      message: html,
    },
  };
  await pluginStore.set({ key: "email", value });
}

function readHtmlTemplate(path) {
  return new Promise((resolve) => {
    fs.readFile(path, { encoding: "utf-8" }, (err, html) => {
      resolve({ err, html });
    });
  });
}

async function sendInvitationEmail(strapi, pluginStore, newUser) {
  const emailSettings = strapi
    .plugin("email")
    .service("email")
    .getProviderSettings();
  const defaultFrom =
    emailSettings?.settings?.defaultFrom || "Strapi <no-reply@strapi.io>";
  const defaultReplyTo =
    emailSettings?.settings?.defaultReplyTo || "Strapi <no-reply@strapi.io>";
  const userPermissionService = strapi
    .plugin("users-permissions")
    .service("users-permissions");
  const inviteLink = `${getAbsoluteAdminUrl(
    strapi.config
  )}/auth/register?registrationToken=${newUser.registrationToken}`;

  const settings = await pluginStore
    .get({ key: "email" })
    .then((storeEmail) => storeEmail.send_magic_link_invite.options);

  settings.message = await userPermissionService.template(settings.message, {
    URL: inviteLink,
    USER: newUser,
  });

  strapi
    .plugin("email")
    .service("email")
    .send({
      to: newUser.email,
      from: defaultFrom,
      replyTo: defaultReplyTo,
      subject: settings.object,
      text: settings.message,
      html: settings.message,
    })
    .catch((err) => {
      strapi.log.error(err);
    });
}
