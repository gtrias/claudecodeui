import React, { useState } from "react";
import { OTPLoginForm } from "./OTPLoginForm";
import { OTPVerifyForm } from "./OTPVerifyForm";

type AuthStep = "email" | "verify";

export const OTPAuthFlow: React.FC = () => {
  const [step, setStep] = useState<AuthStep>("email");
  const [email, setEmail] = useState("");

  const handleCodeSent = (sentEmail: string) => {
    setEmail(sentEmail);
    setStep("verify");
  };

  const handleBack = () => {
    setStep("email");
  };

  if (step === "verify") {
    return <OTPVerifyForm email={email} onBack={handleBack} />;
  }

  return <OTPLoginForm onCodeSent={handleCodeSent} />;
};

export default OTPAuthFlow;
