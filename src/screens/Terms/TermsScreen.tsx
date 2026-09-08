import React from 'react';
import LegalDocScreen from '../Legal/LegalDocScreen';

const sections = [
  {
    heading: '1. Who We Are',
    body:
      'KalleMind is an independent online directory and wellness platform in Zimbabwe.',
  },
  {
    heading: '2. Services',
    body:
      'We provide a Verified Practitioner Directory (Human & Veterinary), a Wellness Hub of educational articles, and a Symptom Checker & Prep Sheet, which is a preparation tool only.',
  },
  {
    heading: '3. Information Only — No Medical Advice',
    body:
      'KalleMind does not provide medical, veterinary, or diagnostic services. All content is for educational and preparation purposes only. Always consult a registered practitioner for medical advice.',
  },
  {
    heading: '4. No Endorsement',
    body:
      'Listing of a practitioner does not constitute endorsement by KalleMind, HPA, MDPCZ, VCZ, or MOHCC. All listings are alphabetical with no paid ranking.',
  },
  {
    heading: '5. User Responsibility',
    body:
      'You are responsible for verifying a practitioner\u2019s registration and making your own healthcare decisions.',
  },
  {
    heading: '6. Limitation of Liability',
    body:
      'KalleMind is not liable for any outcomes from services provided by listed practitioners.',
  },
  {
    heading: '7. Governing Law',
    body:
      'These terms are governed by the laws of Zimbabwe.',
  },
];

export default function TermsScreen(props: any) {
  return (
    <LegalDocScreen
      {...props}
      route={{
        ...props.route,
        params: {
          title: 'Terms of Service',
          lastUpdated: 'July 13, 2026',
          sections,
        },
      }}
    />
  );
}