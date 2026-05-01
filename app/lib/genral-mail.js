import nodemailer from "nodemailer";
import {prisma} from "./prisma"; 

export const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendEmailByTemplate = async ({
  to,
  templateKey,
  variables = {},
}) => {
  // 1. Get template from DB
  const template = await prisma.emailTemplate.findUnique({
    where: { key: templateKey },
  });

  if (!template || template.status !== "ACTIVE") {
    throw new Error("Email template not found or inactive");
  }

  // 2. Replace variables in subject & content
  let subject = template.subject;
  let content = template.content;

  Object.keys(variables).forEach((key) => {
    const value = variables[key];
    const regex = new RegExp(`{{${key}}}`, "g");

    subject = subject.replace(regex, value);
    content = content.replace(regex, value);
  });

  // 3. Send email
  await transporter.sendMail({
    from: `"CDRLOGO" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html: content,
  });
};