import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  ImageSourcePropType,
  BackHandler,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, fontSizes, borderRadius } from '../../theme';

interface ContentBlock {
  heading?: string;
  text: string;
  // Each block carries the single booklet-page image it appeared on.
  image?: ImageSourcePropType;
}

interface Article {
  title: string;
  category: string;
  readTime: string;
  // Short one-line preview shown on the list card. Kept separate from
  // `content` so the card doesn't just show a truncated slice of the
  // first answer/section out of context.
  summary: string;
  // Cover photo shown on the article list card + detail header.
  image?: ImageSourcePropType;
  content: ContentBlock[];
}

const categoryColors: Record<string, string> = {
  'Nutrition': colors.accentGreen,
  'Disease Prevention': colors.error,
  'Mental Health': '#9F7AEA',
  'Maternal Health': '#F687B3',
  'Child Health': '#F6AD55',
  'Fitness': colors.accentBlue,
  'General Health': colors.accentBlue,
  'Infectious Disease': colors.error,
  'Chronic Disease': colors.warning,
  'Public Health': '#9F7AEA',
  'Family Planning': '#3182CE',
  'Menstrual Health': '#ED64A6',
};

const categoryIcons: Record<string, keyof typeof Ionicons.glyphMap> = {
  'Nutrition': 'restaurant-outline',
  'Disease Prevention': 'shield-checkmark-outline',
  'Mental Health': 'happy-outline',
  'Maternal Health': 'heart-outline',
  'Child Health': 'body-outline',
  'Fitness': 'fitness-outline',
  'General Health': 'medkit-outline',
  'Infectious Disease': 'bug-outline',
  'Chronic Disease': 'pulse-outline',
  'Public Health': 'people-outline',
  'Family Planning': 'calendar-outline',
  'Menstrual Health': 'water-outline',
};

// ---------------------------------------------------------------------
// Local booklet photos, bundled into the app so they always render.
//
// These are the ACTUAL booklet pages, extracted from the four PSZ PDFs
// (FAQ, Family Planning Methods, Menstrual Hygiene Management, Wise Up!),
// correctly oriented and color-corrected. Each content block below shows
// the exact page it was transcribed from.
//
// IMPORTANT — adjust these relative paths to match your project. They
// assume a structure like:
//   /assets/images/articles/covers/family-planning-faq.jpg
//   /assets/images/articles/faq_sections/q01_right_candidate.jpg
//   ...etc, mirroring the folder layout in the delivered zip.
// and this screen living two folders deep (e.g. app/(tabs)/articles.tsx),
// matching the existing `../../theme` import above. Change `../../assets`
// if this screen lives somewhere else.
// ---------------------------------------------------------------------

// Partner logo(s) shown in the "Our Partners" section at the bottom of the
// list screen. Same bundled-asset pattern as `covers` above — drop the
// actual PSZ logo file at this path (any reasonably square PNG/JPG works,
// it's rendered inside a circular frame). Swap the path if your logo lives
// somewhere else in /assets.
const partnerLogos = {
  psz: require('../../assets/images/partners/psz.png'),
};

const covers = {
  faq: require('../../assets/images/articles/covers/family-planning-faq.jpg'),
  fpMethods: require('../../assets/images/articles/covers/family-planning-methods.jpg'),
  menstrualHygiene: require('../../assets/images/articles/covers/menstrual-hygiene.jpg'),
  wiseUp: require('../../assets/images/articles/covers/wise-up-guide.jpg'),
};

const faqImg = {
  q01: require('../../assets/images/articles/faq_sections/q01_right_candidate.jpg'),
  q02: require('../../assets/images/articles/faq_sections/q02_future_kids.jpg'),
  q03: require('../../assets/images/articles/faq_sections/q03_cancer_iucd_jadelle.jpg'),
  q04: require('../../assets/images/articles/faq_sections/q04_side_effects.jpg'),
  q05: require('../../assets/images/articles/faq_sections/q05_ec_morning_after.jpg'),
  q06: require('../../assets/images/articles/faq_sections/q06_condom_slip_burst.jpg'),
  q07: require('../../assets/images/articles/faq_sections/q07_depo_fertility.jpg'),
  q08: require('../../assets/images/articles/faq_sections/q08_pills_daily.jpg'),
  q09: require('../../assets/images/articles/faq_sections/q09_pill_same_time.jpg'),
  q10: require('../../assets/images/articles/faq_sections/q10_implants_breastfeeding.jpg'),
  q11: require('../../assets/images/articles/faq_sections/q11_implants_ailments.jpg'),
  q12: require('../../assets/images/articles/faq_sections/q12_loop_10years.jpg'),
  q13: require('../../assets/images/articles/faq_sections/q13_virgin_condom_loop.jpg'),
  q14: require('../../assets/images/articles/faq_sections/q14_sti_cured.jpg'),
  q15: require('../../assets/images/articles/faq_sections/q15_unprotected_sex_withdrawal.jpg'),
  q16: require('../../assets/images/articles/faq_sections/q16_menstrual_cycle_wheel.jpg'),
};

const fpImg = {
  benefits: require('../../assets/images/articles/fp_sections/benefits.jpg'),
  emergencyContraception: require('../../assets/images/articles/fp_sections/emergency_contraception.jpg'),
  jadelle: require('../../assets/images/articles/fp_sections/jadelle.jpg'),
  implanon: require('../../assets/images/articles/fp_sections/implanon.jpg'),
  levoplant: require('../../assets/images/articles/fp_sections/levoplant.jpg'),
  pill: require('../../assets/images/articles/fp_sections/pill.jpg'),
  injectables: require('../../assets/images/articles/fp_sections/injectables.jpg'),
  iucd: require('../../assets/images/articles/fp_sections/iucd.jpg'),
  lam: require('../../assets/images/articles/fp_sections/lam.jpg'),
  condoms: require('../../assets/images/articles/fp_sections/condoms.jpg'),
  fertilityAwareness: require('../../assets/images/articles/fp_sections/fertility_awareness.jpg'),
  tubalLigation: require('../../assets/images/articles/fp_sections/tubal_ligation.jpg'),
  vasectomy: require('../../assets/images/articles/fp_sections/vasectomy.jpg'),
  talkToUs: require('../../assets/images/articles/fp_sections/talk_to_us.jpg'),
};

const mhmImg = {
  briefIntroduction: require('../../assets/images/articles/mhm_sections/brief_introduction.jpg'),
  hygieneTips: require('../../assets/images/articles/mhm_sections/hygiene_tips_cycle_calculator.jpg'),
  firstPeriod: require('../../assets/images/articles/mhm_sections/first_period.jpg'),
  reducePain: require('../../assets/images/articles/mhm_sections/reduce_pain.jpg'),
  sanitaryProducts: require('../../assets/images/articles/mhm_sections/sanitary_products.jpg'),
  washAndStayClean: require('../../assets/images/articles/mhm_sections/wash_and_stay_clean.jpg'),
  disposePadsIsItBlood: require('../../assets/images/articles/mhm_sections/dispose_pads_is_it_blood.jpg'),
  growingUpChanges: require('../../assets/images/articles/mhm_sections/growing_up_changes.jpg'),
  menstrualBloodCalculateCycle: require('../../assets/images/articles/mhm_sections/menstrual_blood_calculate_cycle.jpg'),
  tabooMyths: require('../../assets/images/articles/mhm_sections/taboo_myths.jpg'),
  femaleReproductiveSystem: require('../../assets/images/articles/mhm_sections/female_reproductive_system.jpg'),
  pms: require('../../assets/images/articles/mhm_sections/pms.jpg'),
  quote: require('../../assets/images/articles/mhm_sections/quote.jpg'),
  disordersIntro: require('../../assets/images/articles/mhm_sections/disorders_intro.jpg'),
  causesIrregularPeriods: require('../../assets/images/articles/mhm_sections/causes_irregular_periods.jpg'),
  seekHelp: require('../../assets/images/articles/mhm_sections/seek_help.jpg'),
  treatmentApproach: require('../../assets/images/articles/mhm_sections/treatment_approach.jpg'),
};

const wiseUpImg = {
  abstinence: require('../../assets/images/articles/wiseup_sections/abstinence.jpg'),
  infoForYou: require('../../assets/images/articles/wiseup_sections/info_for_you.jpg'),
  tenThingsToKnow: require('../../assets/images/articles/wiseup_sections/ten_things_to_know.jpg'),
  morningAfter: require('../../assets/images/articles/wiseup_sections/morning_after.jpg'),
  condoms: require('../../assets/images/articles/wiseup_sections/condoms.jpg'),
  iucd: require('../../assets/images/articles/wiseup_sections/iucd.jpg'),
  implants: require('../../assets/images/articles/wiseup_sections/implants.jpg'),
  levoplant: require('../../assets/images/articles/wiseup_sections/levoplant.jpg'),
  depoProvera: require('../../assets/images/articles/wiseup_sections/depo_provera.jpg'),
  stis: require('../../assets/images/articles/wiseup_sections/stis.jpg'),
  knowYourRights: require('../../assets/images/articles/wiseup_sections/know_your_rights.jpg'),
};

// Generic category fallback (remote), only used if an article has no
// local cover image of its own — e.g. future articles added without art yet.
const categoryFallbackImages: Record<string, string> = {
  'Nutrition': 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400',
  'Disease Prevention': 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400',
  'Mental Health': 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=400',
  'Maternal Health': 'https://images.unsplash.com/photo-1555252333-9f8e92e65df9?w=400',
  'Child Health': 'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=400',
  'Fitness': 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=400',
  'General Health': 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=400',
  'Infectious Disease': 'https://images.unsplash.com/photo-1584118624012-df056829fbd0?w=400',
  'Chronic Disease': 'https://images.unsplash.com/photo-1530026405186-ed1f139313f8?w=400',
  'Public Health': 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400',
  'Family Planning': 'https://images.unsplash.com/photo-1555252333-9f8e92e65df9?w=400',
  'Menstrual Health': 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=400',
};

const getColor = (cat: string) => categoryColors[cat] ?? colors.accentGreen;
const getIcon = (cat: string): keyof typeof Ionicons.glyphMap => categoryIcons[cat] ?? 'book-outline';

const getArticleCoverSource = (article: Article): ImageSourcePropType => {
  if (article.image) return article.image;
  return { uri: categoryFallbackImages[article.category] ?? categoryFallbackImages['General Health'] };
};

// Full content reproduced from Population Services Zimbabwe (PSZ) booklets, used with permission.
const localArticles: Article[] = [
  {
    title: 'Frequently Asked Questions: Birth Control, Staying Healthy & Preparing for the Future',
    category: 'Family Planning',
    readTime: '10 min read',
    summary: 'Straight answers to the questions people ask most about contraceptives, side effects, and staying safe.',
    image: covers.faq,
    content: [
      {
        heading: 'Am I the right candidate to use contraceptives?',
        text: "Yes you are if: You don't intend to get pregnant whether you have given birth before or not. Are pursuing other life goals like education and do not want pregnancy to disrupt it. Have given birth and you want to wait before you have another child.",
        image: faqImg.q01,
      },
      {
        heading: 'What contraceptive methods can I use if I want to have kids in the future?',
        text: 'You can use a reversible contraceptive which can discontinue at any time you want to have children like; Injectable contraceptive (Depo Provera), IUCD/Loop, Implants (Jadelle & Implanon), Pills, Levoplant, Condoms (Male & Female).\n\nAm I protected from STIs as well?\nContraceptives are effective in protecting you against pregnancy. Only condoms can protect you against STIs and HIV. You are encouraged to use condoms together with your other contraceptive if at risk of STIs and HIV.',
        image: faqImg.q02,
      },
      {
        heading: 'Am I not going to be exposed to cancer when using IUCD & Jadelle?',
        text: 'Contraceptives are NOT linked to the incidence of cancer, ectopic pregnancies, child deformities, miscarriages and other ailments. Feel free to discuss any fears with this method to your provider for further clarity.',
        image: faqImg.q03,
      },
      {
        heading: 'Do contraceptives have any side effects?',
        text: 'YES! Some women experience side effects. (You can get help in managing the side effects and continue with your contraceptive safely)',
        image: faqImg.q04,
      },
      {
        heading: 'When can I use EC / Morning after?',
        text: 'Women of any age including adolescents can use emergency contraception after having; Unprotected sex without any contraceptive method. Been raped and is not using any contraceptive method.\n\nDoes taking emergency contraceptives disrupt existing pregnancy, cause birth defects or harm the foetus if accidentally taken while one is already pregnant?\nNo! ECPs will not cause any birth defects and will not otherwise harm the foetus if accidentally taken while the woman is pregnant.\n\nCan ECPs be used by an HIV positive woman or women on Anti-Retroviral Therapy?\nYes! Women with HIV and AIDS and those on Anti-Retroviral Therapy can safely use Emergency contraceptive pills.',
        image: faqImg.q05,
      },
      {
        heading: 'Can I use both male & female condoms at the same time?',
        text: 'No! Male and female condoms should not be used together. This can cause friction that may lead to spilling or tearing of the condoms.\n\nWhat should I do if a condom slips or bursts?\nUse emergency contraceptive pills within 120 hours and visit the nearest health facility for HIV Post Exposure Prophylaxis and screening of possible STIs.',
        image: faqImg.q06,
      },
      {
        heading: 'How long should I wait before I can conceive again when I stop using Depo?',
        text: 'Some women may delay to return to fertility.',
        image: faqImg.q07,
      },
      {
        heading: 'Should I continue taking pills even when I am not expecting to have sex?',
        text: "Yes! Pills should be taken same time everyday even on days you do not intend to have sex.\n\nIf I take pills for a long time, will that not affect my fertility rate?\nTaking pills for a long time will not affect your chances of fertility. You're however encouraged to use a long acting reversible method if you wish. Use of hormonal contraceptives including pills is not linked to birth defects, abnormalities or pregnancy complications.",
        image: faqImg.q08,
      },
      {
        heading: 'Is it important for me to take pills at the same time each day?',
        text: "Yes, take the pill same time each day for it to be effective. The effectiveness of the pill is at its highest when taken at the same time.\n\nHow about skipping the placebo (red/brown) pills if I don't want to have my menses?\nPlacebos help the body withdraw excess hormones from control/marvelon pills.",
        image: faqImg.q09,
      },
      {
        heading: 'Is it safe to use implants while breastfeeding?',
        text: "Yes, you can use both Jadelle and Implanon from six weeks after giving birth.\n\nShould I decide to have kids before the prescribed time, can I have it removed? Won't that affect fertility?\nImplants are safe to be used by women of all ages even adolescents. Removing implants before they are due will not cause delay to pregnancy neither will it cause birth defects or pregnancy complications.",
        image: faqImg.q10,
      },
      {
        heading: 'Can I use implants if I have other ailments or am taking medications?',
        text: 'Always talk to your medical service provider about your medical condition and be advised accordingly.',
        image: faqImg.q11,
      },
      {
        heading: '10 years? Should I wait that long to have kids?',
        text: "You have the loop removed at anytime you want to conceive, even before 10 years.\n\nWhat if I am on other medications?\nThe loop can be used by nearly all women safely even with other medication. Women of any age including adolescents or exposed to hard physical work can use this method.\n\nWon't my partner feel it, and does it move around my body?\nNo, your partner does not feel the IUCD and it does not move around the body.",
        image: faqImg.q12,
      },
      {
        heading: 'Can I use a female condom if I am a virgin?',
        text: "Women who haven't had sexual intercourse cannot use it. It needs a wider opening for it to be inserted properly.\n\nCan I use (IUCD) loop if I am a virgin?\nWomen who haven't had sexual intercourse cannot have an IUCD inserted.\n\nWhat should I do if I miss a pill?\nIf you missed one or two pills, take the pill as soon as you remember. This may mean taking two pills in one day. If you miss three or more pills, take the pill as soon as you remember. Continue to take the pill everyday same time. You will need to use a backup method such as condoms for seven days.",
        image: faqImg.q13,
      },
      {
        heading: 'Can I be cured of a sexually transmitted infection?',
        text: 'Some STIs such as syphilis, gonorrhoea, and chlamydia can be cured. However some are viral infections such as hepatitis B, herpes simplex virus (HSV or herpes), HIV, and human papillomavirus (HPV) that are not curable, but there are treatments to manage the infections.\n\nHow do I know that I have contracted an STI?\nSome STIs will not show any symptoms but some may have symptoms such as vaginal or penile discharges, genital sores, lower abdominal pain or pain during sexual intercourse. We encourage partners to have STI screening and testing before any sexual intercourse to avoid contracting STIs.',
        image: faqImg.q14,
      },
      {
        heading: 'Will I fall pregnant if I have unprotected sex once? Can I be pregnant when I have sex for the first time?',
        text: "Yes, any woman who has unprotected vaginal intercourse runs the risk of becoming pregnant whether it's her first time having sex or not. We encourage partners to use contraception for every sexual encounter to avoid unplanned pregnancies.\n\nMy boyfriend says we don't need contraception, because he will pull out at the last minute. Is this a good idea?\nThis contraception method is called the withdrawal method, however it has the highest failure rates. It is more advisable to be on a more effective method that will prevent unplanned pregnancies.",
        image: faqImg.q15,
      },
      {
        heading: "I have heard that women can only get pregnant during a certain part of the menstrual cycle. Could my partner and I have unprotected sex if we avoid these 'dangerous' times of the month?",
        text: "This contraception method is called the Fertility Awareness Method. The method can be very effective if used consistently and correctly. A woman has to know when her fertile time starts and ends on her menstrual cycle. This method will not work if a couple makes a mistake about when the fertile time occurs.",
        image: faqImg.q16,
      },
    ],
  },
  {
    title: 'Know Your Family Planning Methods',
    category: 'Family Planning',
    readTime: '9 min read',
    summary: 'A rundown of every contraceptive option available — how each one works, how long it lasts, and what to expect.',
    image: covers.fpMethods,
    content: [
      { heading: 'Benefits of Family Planning', text: "Gives you control over your life and choices. It can reduce menstrual challenges. Helps recover emotionally and physically after pregnancy. Spacing contributes to healthier families. Stronger families plan together — shared decision making in family planning leads to stronger relationships and respect. Works for all regardless of physical impairment, race, age, religion or class. All family planning methods other than condoms do not protect against STIs including HIV and AIDS.", image: fpImg.benefits },
      { heading: 'Emergency Contraception (Morning After)', text: 'Emergency Contraception is a hormonal method taken within 120 hours of unprotected sexual intercourse to prevent pregnancy. It is used by a woman in situations where: (a) She has had unprotected sexual intercourse without any Family Planning method. (b) She forgets to use her Family Planning method correctly. (c) A condom bursts during sexual intercourse and she is not using any Family Planning method. (d) She is raped and not using any Family Planning method. Remember, Emergency Contraception is not to be used as a method of birth control.', image: fpImg.emergencyContraception },
      { heading: 'Jadelle (Implants)', text: "Jadelle implants are two small soft rods that are inserted under the skin of a woman's upper arm. This is a long term hormonal method for preventing pregnancy for up to five (5) years. It can be removed before 5 years if a woman decides to have a child. It can be used by a breastfeeding mother. Jadelle insertion is a quick procedure that can be done in an outpatient clinic.", image: fpImg.jadelle },
      { heading: 'Implanon', text: "Implanon implant is one small soft rod that is inserted under the skin of a woman's upper arm. This is a long term hormonal method for preventing pregnancy for up to three (3) years. It can be removed before 3 years if a woman decides to have a child. It can be used by a breastfeeding mother. Implanon insertion is a quick procedure that can be done in an outpatient clinic.", image: fpImg.implanon },
      { heading: 'Levoplant', text: 'Levoplant is a set of two small flexible rods, each about the size of a matchstick, lasting for 3 years. Benefits: effective within 24 hours of insertion, no re-supply needed, releases a very low dose of progestin into the bloodstream, almost immediate return to fertility once removed, no routine return visit required until time of removal. After care for all implants: keep the insertion area dry for 4 days, take off the elastic bandage or gauze after 4 days. Side effects can include changes in bleeding patterns, nausea, headaches, and abnormal pain. After the anesthetic wears off, your arm may be sore for a few days, with possible swelling and bruising at the insertion site — this is common and goes away without treatment.', image: fpImg.levoplant },
      { heading: 'Pill', text: 'The pill is a short-term hormonal method for preventing pregnancy, taken by mouth at the same time every day. There are two types: (a) Control Pill (Combined Pill) — can be used by a woman who continues breastfeeding after six months from childbirth. (b) Secure Pill (Progesterone pill) — suitable for a mother who is exclusively breastfeeding for up to six (6) months from childbirth. All contraceptives are medically safe with mild effects which are usually temporary — talk to your provider.', image: fpImg.pill },
      { heading: 'Injectables — Depo Provera / Sayana Press', text: 'Injectable contraceptives are administered through injections and can be used for up to three months per dose, given every 12 weeks with no other effort required in between. In Zimbabwe there are two types available: Depo-Provera and Sayana Press. Both can be used by women who are breastfeeding after 6 weeks from childbirth. Depo-Provera is injected every 12 weeks by a trained provider — it takes a minute to inject and you can return to normal life that day. Remember to visit your health care provider on the day indicated on your record card. Sayana Press can be self-injected after training by a healthcare provider and is a safe method for women of all ages. It may take several months before you can get pregnant after stopping Sayana Press.', image: fpImg.injectables },
      { heading: 'IUCD (Loop)', text: "An IUCD is a small 'T' shaped plastic device placed inside a woman's womb to prevent pregnancy for up to ten (10) years. It is a non-hormonal method, can be used by a woman who is breastfeeding, can be removed at any given time, can be used by women of different ages, and return to fertility is immediate.", image: fpImg.iucd },
      { heading: 'Lactational Amenorrhea Method (LAM)', text: 'This is a natural method of preventing pregnancy for a woman who is exclusively breastfeeding for up to six (6) months after childbirth. A breastfeeding woman uses LAM when: (a) her baby gets little or no food or drink except breast milk and she breastfeeds often, both day and night, and (b) monthly bleeding has not returned after childbirth, and (c) her baby is less than six (6) months old. A woman should plan to take up another method before the end of the effective period — up to six (6) months after childbirth.', image: fpImg.lam },
      { heading: 'Condoms (Male and Female)', text: 'Condoms are short-term family planning methods, effective for prevention of pregnancy, STIs and HIV/AIDS if correctly and consistently used. They can be used together with other family planning methods for dual protection (Dual Protection).', image: fpImg.condoms },
      { heading: 'Fertility Awareness Method (FAM)', text: 'This is a natural method that is based on the use of Basal body temperature, cervical secretions and the menstrual calendar. It is effective when a woman is able to tell the fertile time of her monthly cycle (the period when a woman can become pregnant). A couple must be committed to abstain or use another method such as condoms during this fertile period. FAM may be hard to rely on when one has a fever, a vaginal infection, or after childbirth.', image: fpImg.fertilityAwareness },
      { heading: 'Tubal Ligation', text: "Tubal ligation is a permanent birth control method for women, chosen by a woman who does not want to have children anymore or does not want children at all. It is permanent, does not affect one's menstrual cycle, and does not affect the sex organ, sexuality or pleasure.", image: fpImg.tubalLigation },
      { heading: 'Vasectomy', text: 'Vasectomy is a permanent birth control method for men, chosen by a man who does not want to have children anymore or does not want children at all. It is permanent, does not affect the sex organ, sexuality or pleasure, and vasectomy is not castration (Jongosi/Ngavi/Inkabi). Vasectomy does not protect against STIs including HIV and AIDS, so condoms are encouraged in conjunction with this method.', image: fpImg.vasectomy },
      { heading: 'Talk to Us', text: 'Reach out when you are experiencing side effects of a family planning method, when you feel you were treated unfairly, when you experience or witness gender based violence, or when in need of mental health care. Call for free on Econet 08080020, Netone 08010020, or WhatsApp 0772145222.', image: fpImg.talkToUs },
    ],
  },
  {
    title: 'Menstrual Hygiene Management: A Complete Guide',
    category: 'Menstrual Health',
    readTime: '12 min read',
    summary: 'Everything about periods — hygiene, pain relief, product options, and when irregular cycles are worth a doctor visit.',
    image: covers.menstrualHygiene,
    content: [
      { heading: 'A Brief Introduction', text: 'This booklet has been written to help young girls manage the critical period from the time when they enter adolescence. Adolescence is the time during which boys and girls grow from childhood into adulthood and changes take place in their bodies. During this period, known as puberty, menstruation starts in girls.\n\nMenstruation is commonly called a period or MPs (menstrual period). Menstruation is basically the monthly discharge of blood from the uterus through the vagina of non-pregnant girls and women, from puberty to menopause. The menstruation or bleeding usually lasts from about three to seven days, though some girls\u2019 bleeding may last longer. The whole menstrual process or cycle takes about 28 days from the first day of your MPs, though in a few cases cycles may last as many as 34 days or as few as 19 days.', image: mhmImg.briefIntroduction },
      { heading: '5 Important Menstrual Hygiene Tips', text: '1. Use clean underwear and change them regularly.\n2. Change pads or tampons regularly (once every six hours).\n3. Wash the genital area with plain water (no soap) after each toilet visit and even after urination, if possible. At least wipe with toilet paper or tissue.\n4. Keep the area between the legs dry, otherwise you may experience chafing.\n5. It is very important to remember that the vagina has its own self-cleaning mechanism, and an external cleaning agent like deodorant or soap should not be used inside it.\n\nCycle calculator: day one of your cycle is the first day of your period. Menstrual flow generally runs through the early days of the cycle, followed by a fertile window around ovulation, then an infertile phase before your next period begins.', image: mhmImg.hygieneTips },
      { heading: 'The First Menstrual Period', text: "Girls typically start to menstruate during puberty or adolescence, typically between the ages of 9 and 19. At this time, they experience physical changes, such as breast growth, wider hips and body hair, and emotional changes due to hormones. Menstruation continues until a woman reaches menopause — usually in her late 40s to mid 50s. Then, menstruation ends.\n\nWhat to expect in addition to menstruation\nVaginal discharge, which is different from menstruation, usually begins around the time a girl gets her first period. It can start up to six months before you have your first period. The type of vaginal discharge your body produces can shift during your menstrual cycle and during your lifetime — you may find it heavier or lighter at different times. Healthy discharge is clear or whitish, has a slight odor and can leave a yellowish tint on your panties. Talk to a doctor if your discharge appears green, gray or yellow, looks like cottage cheese, smells fishy or yeasty, or is blood-stained or brownish.", image: mhmImg.firstPeriod },
      { heading: 'What Can Help Reduce the Pain During Your Period?', text: 'Nuts are rich in omega-3 fatty acids and can help you feel better during your period. Fresh fruits, eaten before your flow begins, help ensure a healthy digestive system. Leafy green vegetables are rich in iron and B vitamins, and their high fiber content can help with digestive issues. Red meat helps increase iron intake to make up for the iron lost while bleeding. Whole grains help you have regular bowel movements during your period. Drinking plenty of water helps cleanse your body. Hot water bottles can help with cramps; for severe cramps, ask a doctor for a prescription for pain killers.', image: mhmImg.reducePain },
      { heading: 'Menstrual Sanitary Products', text: 'There are several types of menstrual products to choose from: disposable and reusable sanitary pads, menstrual cups, tampons, and menstrual panties.\n\nHow to manage your period: if you use a pad, place it in your underwear. Never insert the material inside your vagina (except if it\u2019s a tampon or a cup, then you have to insert it into the vagina). Change the cloth, pad, cotton or tissue every two to six hours, or more frequently if you think the blood flow is getting heavy. Talk about menstruation with other girls and women, like your mother, sister, aunt, grandmother, female friend or an older woman in your community — don\u2019t be afraid, it can be scary to see the blood on your underwear, but it is perfectly normal and natural. If you are at school when you get your first menstrual period, tell the matron, a female teacher or a fellow student. Feel proud — your body is developing into that of a young woman.\n\nTip: menstrual products should ideally be stored in a clean, cool, dry place that is free from dust, smoke and chemicals, if at all possible.', image: mhmImg.sanitaryProducts },
      { heading: 'How to Wash and Stay Clean During Menstruation', text: '1. Keep the genitals clean: when you menstruate, the blood tends to enter tiny spaces like the skin between your labia or crust around the opening of the vagina. You should always wash this excess blood away, which also minimizes odor. It is important to wash your vagina and labia well before you change into a new pad, if possible. Always wash or clean the area in a motion that is from the vagina to the anus, never in the opposite direction — washing the wrong way can cause bacteria from the anus to lodge in the vagina and urethral opening, leading to infections. If you cannot wash yourself before you change pads, be sure to wipe off the area using toilet paper or tissue.\n\n2. Keep the groin area dry: this helps you avoid infections or vaginal fungi.\n\n3. Don\u2019t use cleaning agents in the vagina: the vagina has its own cleaning mechanism that works in a very fine balance of good and bad bacteria. Washing it with soap can kill the good bacteria, increasing the risk of infections. While it is important to wash yourself regularly during this time, all you need to use is some warm water. You can use soap on the external parts, but do not use it inside your vagina or vulva, and do not try to remove bad odor with deodorant.', image: mhmImg.washAndStayClean },
      { heading: 'How to Dispose of Sanitary Pads & Is It Really Blood?', text: 'Disposable sanitary pads should be discarded after one use, never flushed down the toilet. A re-usable pad can be washed and reused at least 100 times when following the washing instructions; once it can no longer be reused, it should also be disposed of.\n\nIs it really blood? Menstrual discharge is not just blood, but a mixture of uterine lining tissue and blood. Total monthly menstrual discharge varies from about 4 to 12 teaspoons, and the average woman\u2019s flow is between 30 and 40 ml. Anything over 60 ml is considered heavy menstrual bleeding. Flow is lighter at the start of the period, heavier for a time, then lighter again. Color also changes from brownish-red at the start, to darker red in the middle, back to light or brownish-red at the end.', image: mhmImg.disposePadsIsItBlood },
      { heading: 'What Physical, Emotional and Social Changes Occur as a Girl Grows Up?', text: 'From about ages 5\u20138, then 9\u201315, and 15\u201320, a girl\u2019s body and life gradually change.\n\nPhysical changes: height gain, weight gain, acne, growth of hair on the armpits and genitals, voice becomes higher pitched, development of the vagina and breasts, and menstruation.\n\nEmotional changes: ambition/desire/dreams, shyness, strong opinions.\n\nSocial changes: responsibility, individual desire, seeking independence and testing boundaries.', image: mhmImg.growingUpChanges },
      { heading: 'What Is Menstrual Blood and How to Calculate Your Cycle', text: 'Menstruation is the regular discharge of blood and mucosa from the uterus through the vagina. The uterus is a hollow, pear-shaped organ that is responsible for nourishing the embryo and fetus during a pregnancy. When preparing for an egg, the uterus mucosa thickens — this helps the uterus hold on to a fertilized egg. If the egg is not fertilized, the mucosa is released through the vagina as menstrual blood.\n\nHow to calculate your menstrual cycle: day one of the cycle is day one of your period; cycle day two is the second day of your period, and so on. For example, if the first day of your menstrual cycle is March 4 and you bleed for five days, the duration of your period is five days for the month of March. If your next period starts on April 2, then your menstrual cycle length is the number of days from March 4 to April 1 (the day before your next period), which is 29 days — you should not count the first day of your next period, because that day is part of the next menstrual cycle.', image: mhmImg.menstrualBloodCalculateCycle },
      { heading: 'What Is a Taboo?', text: 'A taboo is something people don\u2019t like to talk about, so they avoid conversation about the topic. One common menstruation taboo is that periods are embarrassing and that women are unclean during the time of their period. But it is not true — periods are completely natural and should not be surrounded by shame.\n\nCommon myths: a lot of women are oppressed in their daily lives by myths. Some of the most common myths — all of which are untrue — are that women cannot: attend religious functions, cook, go to school, touch males, or eat certain types of food while menstruating.', image: mhmImg.tabooMyths },
      { heading: 'The Female Reproductive System', text: 'The menstrual cycle usually lasts approximately 28 days but can vary from 21 to 35 days. Each cycle involves the release of an egg (ovulation), which moves into the uterus through the fallopian tubes. Tissue and blood line the walls of the uterus for fertilization; if the egg is not fertilized, the lining is shed through the vagina along with blood. Bleeding generally lasts between two and seven days. The cycle is often irregular for the first year or two after menstruation begins.\n\nMenstrual side effects: during or before the bleeding part of the menstrual cycle, many women and girls suffer from pains such as abdominal cramps, nausea, fatigue, lightheadedness, headaches, backache and general discomfort. They can also experience emotional and psychological changes such as heightened feelings of sadness, irritability or anger due to changing hormones — this varies from person to person and can change significantly over time. Menstruation stops after menopause, which usually occurs between 45 and 55 years of age.', image: mhmImg.femaleReproductiveSystem },
      { heading: 'Do You Know What PMS Is?', text: 'PMS stands for Pre-Menstrual Syndrome. Usually, a few days before menstruation, you may start feeling some soreness or heaviness in your breasts, and your stomach may feel bloated. You may get headaches, backaches, nausea and food cravings. Sometimes, because of the fluctuating hormone levels, you may feel more moody, sad or emotional than usual. Common symptoms include sore breasts, abdominal pain, headache, backaches, acne, and mood changes.', image: mhmImg.pms },
      { heading: 'Normal vs. Not-So-Normal', text: "\u201cMenstruation is a healthy and normal part of most women and girls\u2019 lives. Let\u2019s break the silence and talk about it.\u201d\n\nWhile menstruation is a natural process, irregularities may arise, leading to discomfort and disruption to your life. Everyone's body is different, and so is your menstrual cycle. Signs that may not be normal include: shortened periods lasting 3 days, extended periods lasting more than 7 days, no-show periods (skipping a month or longer), early or late periods varying from a few days to weeks, and spotting in between periods or experiencing more than one period in a month.", image: mhmImg.disordersIntro },
      { heading: 'What Causes Irregular Periods?', text: 'Hormonal imbalances (such as PCOS or thyroid disorders), stress and lifestyle factors (chronic stress, inadequate sleep, poor nutrition, excessive exercise), weight fluctuations, endometriosis (a medical condition where tissue similar to the lining of the uterus grows outside the uterus, causing severe pain and fertility issues), underlying medical conditions (diabetes, thyroid irregularities), birth control methods (especially when changing or discontinuing), and uterine or ovarian issues such as fibroids or cysts. Signs of an irregular period include unpredictable menstrual flow, changes in the colour, texture or odour of menstrual blood, intense or persistent menstrual cramps, migraines and headaches around your cycle, and other symptoms such as mood changes, fatigue, low energy or nausea.', image: mhmImg.causesIrregularPeriods },
      { heading: "Key Signs It's Time to Seek Help", text: "While the intricacies of the menstrual journey are unique to each woman, some key signs may indicate it's time to seek help: your menstrual cycle is irregular and you've experienced missed periods or no period at all. Your periods are significantly longer or shorter than your usual rhythm. You experience intense and disruptive pain during menstruation. Unexpected bleeding occurs between your regular periods. Menstruation symptoms like headaches and mood swings become hard to manage in the weeks leading up to your period. Your first menstruation started either earlier or later than the average age range of 12 to 16 years old.\n\nIf you're nodding along and thinking 'Yep, that's me!' — it's your cue to step up, take the reins, and bring back the good vibes to your menstrual health.", image: mhmImg.seekHelp },
      { heading: 'Our Treatment Approach', text: 'A personalised menstrual counselling session providing a supportive space to discuss and address a variety of menstrual concerns. Ultrasound and blood tests to pinpoint the root causes of irregularities. Advice on lifestyle changes and tailored treatment options to enhance your overall well-being. Moreover, we go beyond counselling by facilitating referrals to specialists for further tests and treatments if a complex medical condition is identified. It\u2019s your journey, your power — let\u2019s chat about it.', image: mhmImg.treatmentApproach },
    ],
  },
  {
    title: 'Wise Up! Your Guide to Birth Control, Staying Healthy & Preparing for the Future You Want',
    category: 'Family Planning',
    readTime: '11 min read',
    summary: 'A youth-focused guide to contraceptives, emergency options, STIs, and knowing your rights.',
    image: covers.wiseUp,
    content: [
      { heading: 'Abstinence', text: "The best way to stay in touch with your dreams, maintain your ego and stay clear of pregnancy and STIs is abstinence. It is wise to know the risks of sex before you engage in any sexual act: you can get pregnant even the first time you have sex, you can get an STI including HIV, and you can have your heart broken or feel let down when it's over. The Facts: Abstinence is 100% effective in preventing pregnancy. You stay clear of STIs including HIV and AIDS if you abstain. You can pursue your life goals and career without disruption from unplanned pregnancy — it's worth 'the wait.' You maintain your ego intact. If nature calls and you fail to abstain, use a condom correctly and consistently, and use an Emergency Contraceptive 'Morning After' pill within 120 hours in the event of unprotected sex, condom burst/slip, or inconsistent condom use.", image: wiseUpImg.abstinence },
      { heading: 'This Information Is for You If You...', text: "Don't have children. Do have children. Have never had sex. Have had sex. Are married. Are not married. Want to get an education. Want to have a family someday. Want to space your children.\n\nA wise youth who uses contraceptives is in control of her life, her future and her dreams. Starting a family is an important decision that changes your life forever, and doing it at the right time can be the key to your happiness and success. Each contraceptive is unique, just like you, so you can select the one that works best for you.", image: wiseUpImg.infoForYou },
      { heading: '10 Things to Know About Contraceptives', text: "ALL contraceptive methods help you prevent unplanned pregnancies. It is possible to get pregnant even the first time you have sex. It's good to start thinking about contraceptives even before you've had sex. Contraceptives do NOT cause you to be barren, not even a little. You can stop using contraceptives anytime you wish and still become pregnant. There is NO LINK between modern contraceptive methods and cancer. Possible side effects of some methods usually improve as your body adjusts. Every method is a little different, so you can select the one that's right for you. It's totally okay to try one method and then switch to another. You should always wear a condom to protect against STIs including HIV.", image: wiseUpImg.tenThingsToKnow },
      { heading: 'Morning After (Emergency Contraception)', text: 'If your contraceptive fails or you have unprotected sex, you still have options to prevent pregnancy. You can take emergency contraception (EC) for up to 120 hours after sex. EC is a pill or set of pills used as soon as possible after unprotected sex — it is not intended to be used regularly, and does not interfere with an existing pregnancy. The Facts: the sooner you take EC, the more effective it is, so take it as soon as possible. It\u2019s important to choose another form of contraceptive as soon as possible. It\u2019s recommended to get tested for STIs including HIV. EC may cause nausea and vomiting.', image: wiseUpImg.morningAfter },
      { heading: 'Condoms', text: "Always consider protected sex to prevent unexpected pregnancies and avoid HIV and STIs by using a condom. Condoms are barrier methods of contraception — they stop sperm from meeting an egg. A male condom fits over a man's erect penis and is made of very thin latex (rubber) or polyurethane (plastic). A female condom is made of polyurethane and is put in the vagina, loosely lining it. The Facts: the condom is one of the most accessible and inexpensive forms of birth control available. People who use condoms feel their experiences are just as pleasurable as people who don't. There's no medical reason someone can't use a condom — even people with latex allergies can use them, as there are latex-free condoms made of polyurethane and polyisoprene. When it comes to HIV, using a condom makes sex 10,000 times safer than not using one.", image: wiseUpImg.condoms },
      { heading: 'IUCD', text: "Do you want to be protected from pregnancy for as long as you want, without having to remember to do anything at all? An IUCD can make you feel like a queen because you're always protected. The IUCD delivers it all — completely invisible, lasts up to 10 years, but can be removed whenever you want. Even if you haven't had a child yet, it's a super choice for any girl.\n\nHow it works: an IUCD is a small, T shaped piece of plastic and copper that is inserted in your uterus by a trained nurse or doctor. It can protect you from pregnancy for up to 10 years, but if you're ready for children earlier, you can have it removed at any time. Remember to use it with a condom to protect against STIs. The Facts: most low maintenance of all options (no work for you!), totally hidden so nobody has to know but you, takes only a few minutes for a nurse or doctor to insert it, can be removed anytime to get pregnant right away, no hormones, and may cause heavier periods/bleeding for the first 3 months before normalising.", image: wiseUpImg.iucd },
      { heading: 'Implants', text: "Dreaming of spending the next few years in university, travelling or just having fun? Try a birth control method that's made to last. Implants last up to 5 years (Jadelle) and 3 years (Implanon), but can be removed at any time if you change your mind — and it's hardly noticeable.\n\nHow it works: small soft rod(s) are implanted under the skin in your upper arm. In only 10 minutes they start releasing hormones that prevent pregnancy for years. Remember to use it with a condom to protect against STIs. The Facts: low maintenance and fast, hardly visible, takes only a few minutes for a nurse or doctor to insert it, can be removed anytime to get pregnant quickly, and contains hormones so spotting may occur for the first few months.", image: wiseUpImg.implants },
      { heading: 'Levoplant', text: 'Levoplant is a set of two small flexible rods, each about the size of a matchstick, lasting 3 years. Benefits: effective within 24 hours of insertion, no re-supply needed, releases a very low dose of progestin into the bloodstream, almost immediate return to fertility once removed, return to fertility is easy with implant removal, and no routine return visit is required until time of removal. After the insertion / after care: keep the insertion area dry for 4 days, take off the elastic bandage or gauze after 4 days. Side effects can include changes in bleeding patterns, nausea, headaches, and abnormal pain. After the anesthetic wears off, your arm may be sore for a few days, and you may also have swelling and bruising at the insertion site — this is common and will go away without treatment.', image: wiseUpImg.levoplant },
      { heading: 'Depo Provera', text: "Too busy to worry about daily routines? The injection is a quick and easy way to prevent pregnancy. And it's private, so nobody has to know you're using it. Stop in for a shot every 3 months and then get on with your life without worrying.\n\nHow it works: receive an injection from a nurse every 3 months to prevent pregnancy. You can become pregnant again 3 months after your last injection. Remember to use with a condom to protect against STIs. The Facts: low maintenance and fast, totally hidden so nobody has to know but you, may experience lighter or stopped periods after a few months (which isn't harmful and doesn't mean you're pregnant), and contains hormones — possible side effects include weight changes or irregular periods, which usually improve with time.", image: wiseUpImg.depoProvera },
      { heading: 'STIs', text: "What are sexually transmitted infections (STIs)? STIs are diseases that are passed from one person to another through sexual contact. These include chlamydia, gonorrhoea, genital herpes, human papillomavirus (HPV), syphilis, and HIV. Many of these STIs do not show symptoms for a long time. Even without symptoms, they can still be harmful and passed on during sex.\n\nWhat are the signs and symptoms of STIs? STIs can have a range of signs and symptoms and differ from one STI to another. However some STIs don't cause any symptoms that you would notice — the only way to know for sure if you have an STI is to get tested. Signs and symptoms that might indicate an STI include: sores or bumps on the genitals or in the oral or rectal area, painful or burning urination, discharge from the penis, unusual or odd-smelling vaginal discharge, unusual vaginal bleeding, pain during sex, sore or swollen lymph nodes (particularly in the groin but sometimes more widespread), lower abdominal pain, fever, and rash over the trunk, hands or feet. Signs and symptoms may appear a few days after exposure, or it may take years before you have any noticeable problems, depending on the organism.\n\nWhere can I get tested? There are places that offer teen-friendly, confidential STI tests, meaning no one has to find out you've been tested. Call for free on Econet 08080019/08080020, Netone 08080019/08010020, or send WhatsApp or SMS to +263 772 145 222 to get directions to a youth friendly clinic near you.", image: wiseUpImg.stis },
      { heading: 'Know Your Rights', text: "Can STIs be treated? Your doctor can prescribe medicine to cure some STIs, like chlamydia and gonorrhoea. Other STIs, like herpes, can't be cured, but you can take medicine to help with the symptoms. If you are ever treated for an STI, be sure to finish all of your medicine, even if you feel better before you finish it all. Ask the doctor or nurse about testing and treatment for your partner, too. You and your partner should avoid having sex until you've both been treated — otherwise, you may continue to pass the STI back and forth. It is possible to get an STI again (after you've been treated) if you have sex with someone who has an STI.\n\nDid you know? Section 76 of the Constitution of Zimbabwe provides that every citizen and permanent resident of Zimbabwe has the right to have access to basic health-care services, including reproductive health-care services. Section 78 of the constitution protects you as a young person below 18 from forced marriages, and section 70 of the Criminal Codification Act (Chapter 9:23) protects every young person under 16 from sexual abuse. Know your rights — if your rights are being violated, contact our toll-free lines for assistance and referral.", image: wiseUpImg.knowYourRights },
    ],
  },
];

// Tabs are derived from the categories that actually exist in
// localArticles, instead of a hand-typed list — so a tab is never shown
// unless there's real content behind it, and filtering (below) always
// has something to match against.
const tabs = ['All', ...Array.from(new Set(localArticles.map(a => a.category)))];

export default function ArticlesScreen() {
  const insets = useSafeAreaInsets();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Article | null>(null);
  const [activeTab, setActiveTab] = useState('All');

  useEffect(() => {
    setArticles(localArticles);
    setLoading(false);
  }, []);

  // Android hardware back button: while an article is open, back should
  // return to the list (not pop this whole screen off the nav stack).
  // Returning `true` tells BackHandler we handled it ourselves; returning
  // `false` when no article is open lets normal back-navigation happen.
  useEffect(() => {
    const onBackPress = () => {
      if (selected) {
        setSelected(null);
        return true;
      }
      return false;
    };
    const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => subscription.remove();
  }, [selected]);

  // Real filtering, matched against the category values derived into
  // `tabs` above — 'All' shows everything, any other tab shows only
  // articles whose category matches it exactly.
  const filteredArticles = activeTab === 'All' ? articles : articles.filter(a => a.category === activeTab);

  if (selected) {
    return (
      <View style={styles.container}>
        <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
          <TouchableOpacity style={styles.backBtn} onPress={() => setSelected(null)}>
            <Ionicons name="arrow-back" size={20} color={colors.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Article</Text>
          <Text style={styles.headerSub}>Reproduced with permission from PSZ</Text>
        </View>
        <ScrollView showsVerticalScrollIndicator={false}>
          <Image source={getArticleCoverSource(selected)} style={styles.articleImage} resizeMode="contain" />
          <View style={styles.articleContent}>
            <View style={[styles.categoryBadge, { backgroundColor: getColor(selected.category) + '22' }]}>
              <Ionicons name={getIcon(selected.category)} size={13} color={getColor(selected.category)} />
              <Text style={[styles.categoryText, { color: getColor(selected.category) }]}>
                {selected.category}
              </Text>
            </View>
            <Text style={styles.articleTitle}>{selected.title}</Text>
            <View style={styles.articleMeta}>
              <Ionicons name="time-outline" size={13} color={colors.text.secondary} />
              <Text style={styles.readTime}>{selected.readTime}</Text>
            </View>

            {selected.content.map((block, i) => (
              <View key={i} style={styles.contentBlock}>
                {block.heading ? <Text style={styles.blockHeading}>{block.heading}</Text> : null}
                <Text style={styles.articleBody}>{block.text}</Text>
                {block.image && (
                  <Image source={block.image} style={styles.blockImage} resizeMode="contain" />
                )}
              </View>
            ))}

            <View style={styles.disclaimer}>
              <Text style={styles.disclaimerText}>
                Content reproduced with permission from Population Services Zimbabwe (PSZ). For general education only — not medical advice. Always consult a licensed healthcare professional.
              </Text>
            </View>
          </View>
          <View style={{ height: spacing.xl }} />
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.headerTitle}>Wellness Hub</Text>
            <Text style={styles.headerSub}>Discover. Learn. Connect.</Text>
          </View>
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsScroll}>
        <View style={styles.tabs}>
          {tabs.map((tab, i) => (
            <TouchableOpacity
              key={i}
              style={[styles.tab, activeTab === tab && styles.tabActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.scroll}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color={colors.accentGreen} size="large" />
            <Text style={styles.loadingText}>Loading articles...</Text>
          </View>
        ) : filteredArticles.length === 0 ? (
          <View style={styles.loadingContainer}>
            <Ionicons name="file-tray-outline" size={40} color={colors.text.secondary} />
            <Text style={styles.loadingText}>No articles in this category yet.</Text>
          </View>
        ) : (
          filteredArticles.map((article, i) => (
            <TouchableOpacity key={i} style={styles.card} onPress={() => setSelected(article)}>
              <Image source={getArticleCoverSource(article)} style={styles.cardImage} resizeMode="contain" />
              <View style={styles.cardContent}>
                <View style={[styles.categoryBadge, { backgroundColor: getColor(article.category) + '22' }]}>
                  <Ionicons name={getIcon(article.category)} size={12} color={getColor(article.category)} />
                  <Text style={[styles.categoryText, { color: getColor(article.category) }]}>
                    {article.category}
                  </Text>
                </View>
                <Text style={styles.cardTitle}>{article.title}</Text>
                <Text style={styles.cardSummary} numberOfLines={2}>{article.summary}</Text>
                <View style={styles.cardMeta}>
                  <Ionicons name="time-outline" size={12} color={colors.text.secondary} />
                  <Text style={styles.readTime}>{article.readTime}</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}

        <View style={styles.partnersBanner}>
          <View style={styles.partnersTitleRow}>
            <Ionicons name="people" size={18} color={colors.accentGreen} />
            <Text style={styles.partnersTitle}>Our Partners</Text>
          </View>
          <View style={styles.partnerCard}>
            <View style={styles.partnerLogoWrap}>
              <Image source={partnerLogos.psz} style={styles.partnerLogoImg} resizeMode="contain" />
            </View>
            <View style={styles.partnerInfo}>
              <Text style={styles.partnerName}>Population Services Zimbabwe</Text>
              <Text style={styles.partnerDesc}>
                All content in the Wellness Hub is reproduced with permission from PSZ's reproductive health booklets.
              </Text>
            </View>
          </View>
        </View>

        <View style={{ height: spacing.xl }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f5fa' },
  header: { backgroundColor: colors.navBackground, padding: spacing.lg, paddingTop: spacing.xl },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { fontSize: fontSizes.xl, fontWeight: '800', color: colors.white, marginBottom: 2 },
  headerSub: { fontSize: fontSizes.xs, color: colors.accentGreenLight, fontWeight: '500' },
  backBtn: { marginBottom: spacing.sm },
  tabsScroll: { backgroundColor: colors.navBackground, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.07)', maxHeight: 48 },
  tabs: { flexDirection: 'row', gap: spacing.sm, padding: spacing.sm, paddingHorizontal: spacing.md },
  tab: { backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: borderRadius.full, paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.1)' },
  tabActive: { backgroundColor: colors.accentGreen, borderColor: colors.accentGreen },
  tabText: { color: colors.text.nav, fontSize: fontSizes.xs, fontWeight: '600' },
  tabTextActive: { color: colors.white },
  scroll: { flex: 1, padding: spacing.md },
  loadingContainer: { alignItems: 'center', marginTop: spacing.xxl, gap: spacing.md },
  loadingText: { color: colors.text.secondary, fontSize: fontSizes.sm },
  card: { backgroundColor: colors.card, borderRadius: borderRadius.lg, marginBottom: spacing.md, borderWidth: 1, borderColor: colors.border, overflow: 'hidden', flexDirection: 'row' },
  cardImage: { width: 90, aspectRatio: 210 / 297, backgroundColor: colors.border },
  cardContent: { flex: 1, padding: spacing.md, justifyContent: 'center' },
  categoryBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', borderRadius: borderRadius.full, paddingHorizontal: spacing.sm, paddingVertical: 2, marginBottom: spacing.xs },
  categoryText: { fontSize: fontSizes.xs, fontWeight: '700' },
  cardTitle: { color: colors.navBackground, fontWeight: '700', fontSize: fontSizes.md, marginBottom: spacing.xs },
  cardSummary: { color: colors.text.secondary, fontSize: fontSizes.sm, lineHeight: 20, marginBottom: spacing.xs },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  readTime: { color: colors.text.secondary, fontSize: fontSizes.xs, marginRight: spacing.sm },
  articleImage: { width: '100%', aspectRatio: 210 / 297, backgroundColor: colors.border },
  articleContent: { padding: spacing.lg },
  articleTitle: { color: colors.navBackground, fontWeight: '800', fontSize: fontSizes.xl, marginBottom: spacing.xs, marginTop: spacing.sm, lineHeight: 28 },
  articleMeta: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginBottom: spacing.md },
  contentBlock: { marginTop: spacing.md },
  blockHeading: { fontSize: fontSizes.md, fontWeight: '700', color: colors.navBackground, marginBottom: spacing.xs },
  articleBody: { color: colors.text.secondary, fontSize: fontSizes.md, lineHeight: 24 },
  // A4 page ratio (210mm x 297mm = 0.7071) so each booklet page renders at
  // true A4 proportions, full width, with no cropping and no distortion —
  // matching how the pages look in the source PDFs.
  blockImage: { width: '100%', aspectRatio: 210 / 297, borderRadius: borderRadius.md, marginTop: spacing.sm, backgroundColor: colors.border },
  disclaimer: { backgroundColor: '#fff8e6', borderLeftWidth: 3, borderLeftColor: colors.warning, padding: spacing.sm, borderRadius: borderRadius.sm, marginTop: spacing.lg },
  disclaimerText: { fontSize: fontSizes.xs, color: '#5a3e00', lineHeight: 18 },
  // "Our Partners" section — credits PSZ as the source org for all
  // Wellness Hub content. Sits at the bottom of the article LIST screen
  // only (individual articles already carry their own PSZ disclaimer at
  // the end of each piece).
  partnersBanner: { marginBottom: spacing.md },
  partnersTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: spacing.sm },
  partnersTitle: { fontSize: fontSizes.md, fontWeight: '700', color: colors.navBackground },
  partnerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  partnerLogoWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  partnerLogoImg: { width: '100%', height: '100%' },
  partnerInfo: { flex: 1 },
  partnerName: { fontSize: fontSizes.sm, fontWeight: '700', color: colors.navBackground, marginBottom: 2 },
  partnerDesc: { fontSize: fontSizes.xs, color: colors.text.secondary, lineHeight: 17 },
});
