import React from 'react';
import LegalDocScreen from './LegalDocScreen';

const sections = [
  {
    heading: '1. Data We Collect — Public Directory',
    body:
      'For practitioners listed in our directory, we collect name, qualifications, registration number, clinic details, and contact information. This comes from public council registers and information practitioners provide directly to us.',
  },
  {
    heading: '2. Data We Do NOT Collect',
    body:
      'We do not collect, store, or process patient health data, diagnoses, or symptoms entered into the Symptom Checker.',
  },
  {
    heading: '3. How We Use Data',
    body:
      'We use collected data to verify practitioners and to display public directory information only.',
  },
  {
    heading: '4. Your Rights',
    body:
      'Practitioners can request to update or remove their listing at any time by emailing kallemind@gmail.com.',
  },
  {
    heading: '5. Compliance',
    body:
      'We comply with the Zimbabwe Data Protection Act. No data is sold to third parties.',
  },
];

export default function PrivacyPolicyScreen(props: any) {
  return (
    <LegalDocScreen
      {...props}
      route={{
        ...props.route,
        params: {
          title: 'Privacy Policy',
          lastUpdated: 'July 13, 2026',
          sections,
        },
      }}
    />
  );
}