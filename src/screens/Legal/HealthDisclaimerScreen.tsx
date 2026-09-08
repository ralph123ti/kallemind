import React from 'react';
import LegalDocScreen from './LegalDocScreen';

const sections = [
  {
    heading: 'Information Only — Not Medical Advice',
    body:
      'Everything in KalleMind, including the Symptom Checker, Doctor Prep Sheet, and Health Articles, is provided for general educational purposes only. It is not intended to diagnose, treat, cure, or prevent any disease or health condition.',
  },
  {
    heading: 'No Doctor-Patient Relationship',
    body:
      'Using KalleMind does not create a doctor-patient relationship between you and KalleMind, its creators, or any doctor listed in the app, unless and until you separately engage that provider for care.',
  },
  {
    heading: 'Always Consult a Professional',
    body:
      'Always seek the advice of a physician or other qualified health provider with any questions you may have regarding a medical condition. Never disregard professional medical advice or delay seeking it because of something you read in this app.',
  },
  {
    heading: 'Emergencies',
    body:
      'If you think you may have a medical emergency, call your local emergency number or go to the nearest emergency room immediately. Do not rely on KalleMind in an emergency.',
  },
  {
    heading: 'Doctor Directory & Verification',
    body:
      'KalleMind verifies practitioner registration status only. We do not endorse, vet, or take responsibility for the quality, conduct, or outcomes of any practitioner listed in the app. Users must do their own due diligence before choosing or engaging any doctor found through KalleMind.',
  },
  {
    heading: 'Accuracy of Information',
    body:
      'While we aim to keep health information accurate and up to date, medicine and health guidance evolve. We make no warranties about the completeness, reliability, or accuracy of the information in the app.',
  },
];

export default function HealthDisclaimerScreen(props: any) {
  return (
    <LegalDocScreen
      {...props}
      route={{
        ...props.route,
        params: {
          title: 'Health Disclaimer',
          lastUpdated: 'July 6, 2026',
          sections,
        },
      }}
    />
  );
}