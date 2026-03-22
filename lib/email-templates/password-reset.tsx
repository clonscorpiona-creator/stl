import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import * as React from "react";

interface PasswordResetEmailProps {
  resetUrl: string;
}

export const PasswordResetEmail = ({ resetUrl }: PasswordResetEmailProps) => (
  <Html>
    <Head />
    <Preview>Сброс пароля для СТЛ</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Сброс пароля</Heading>
        <Text style={text}>
          Вы запросили сброс пароля для вашего аккаунта СТЛ. Нажмите на кнопку ниже, чтобы создать новый пароль:
        </Text>
        <Section style={buttonContainer}>
          <Button style={button} href={resetUrl}>
            Сбросить пароль
          </Button>
        </Section>
        <Text style={text}>
          Или скопируйте и вставьте эту ссылку в ваш браузер:
        </Text>
        <Link href={resetUrl} style={link}>
          {resetUrl}
        </Link>
        <Text style={warning}>
          ⚠️ Эта ссылка действительна в течение 1 часа.
        </Text>
        <Text style={footer}>
          Если вы не запрашивали сброс пароля, просто проигнорируйте это письмо. Ваш пароль останется без изменений.
        </Text>
      </Container>
    </Body>
  </Html>
);

export default PasswordResetEmail;

const main = {
  backgroundColor: "#f6f9fc",
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "20px 0 48px",
  marginBottom: "64px",
};

const h1 = {
  color: "#333",
  fontSize: "24px",
  fontWeight: "bold",
  margin: "40px 0",
  padding: "0 48px",
};

const text = {
  color: "#333",
  fontSize: "16px",
  lineHeight: "26px",
  padding: "0 48px",
};

const buttonContainer = {
  padding: "27px 48px",
};

const button = {
  backgroundColor: "#5469d4",
  borderRadius: "8px",
  color: "#fff",
  fontSize: "16px",
  fontWeight: "bold",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "block",
  padding: "12px 24px",
};

const link = {
  color: "#5469d4",
  fontSize: "14px",
  textDecoration: "underline",
  padding: "0 48px",
  wordBreak: "break-all" as const,
};

const warning = {
  color: "#e67e22",
  fontSize: "14px",
  fontWeight: "bold",
  lineHeight: "24px",
  padding: "12px 48px",
};

const footer = {
  color: "#8898aa",
  fontSize: "14px",
  lineHeight: "24px",
  padding: "24px 48px",
};
