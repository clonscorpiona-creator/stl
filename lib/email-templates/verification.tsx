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

interface VerificationEmailProps {
  verifyUrl: string;
}

export const VerificationEmail = ({ verifyUrl }: VerificationEmailProps) => (
  <Html>
    <Head />
    <Preview>Подтвердите ваш email для СТЛ</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Подтверждение email</Heading>
        <Text style={text}>
          Спасибо за регистрацию на платформе СТЛ! Пожалуйста, подтвердите ваш email адрес, нажав на кнопку ниже:
        </Text>
        <Section style={buttonContainer}>
          <Button style={button} href={verifyUrl}>
            Подтвердить email
          </Button>
        </Section>
        <Text style={text}>
          Или скопируйте и вставьте эту ссылку в ваш браузер:
        </Text>
        <Link href={verifyUrl} style={link}>
          {verifyUrl}
        </Link>
        <Text style={footer}>
          Если вы не регистрировались на СТЛ, просто проигнорируйте это письмо.
        </Text>
      </Container>
    </Body>
  </Html>
);

export default VerificationEmail;

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

const footer = {
  color: "#8898aa",
  fontSize: "14px",
  lineHeight: "24px",
  padding: "24px 48px",
};
