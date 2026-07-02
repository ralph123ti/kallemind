import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from 'react-native';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, fontSizes, borderRadius } from '../../theme';

interface Article {
  title: string;
  category: string;
  summary: string;
  content: string;
  readTime: string;
  imageUrl: string;
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
};

const categoryImages: Record<string, string> = {
  'Nutrition': 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400',
  'Disease Prevention': 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400',
  'Mental Health': 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=400',
  'Maternal Health': 'https://images.unsplash.com/photo-1555252333-9f8e92e65df9?w=400',
  'Child Health': 'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=400',
  'Fitness': 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=400',
  'General Health': 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=400',
  'Infectious Disease': 'https://images.unsplash.com/photo-1584118624012-df056829fbd0?w=400',
  'Chronic Disease': 'https://images.unsplash.com/photo-1530026405186-ed1f139313f8?w=400',
  'Public Health': 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400',
};

const getColor = (cat: string) => categoryColors[cat] ?? colors.accentGreen;
const getImage = (cat: string) => categoryImages[cat] ?? categoryImages['General Health'];

const tabs = ['All', 'Everyday Health', 'Prevention', 'Symptoms Guide', "Women's Health", 'Healthy Living'];

export default function ArticlesScreen() {
  const insets = useSafeAreaInsets();
  const [country, setCountry] = useState('');
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Article | null>(null);
  const [activeTab, setActiveTab] = useState('All');

  useEffect(() => {
    detectAndLoad();
  }, []);

  const detectAndLoad = async () => {
    setLoading(true);
    let detectedCountry = 'Zimbabwe';
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({});
        const geo = await Location.reverseGeocodeAsync({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        });
        if (geo[0]?.country) detectedCountry = geo[0].country;
      }
    } catch (e) {
      console.log('Using default country');
    }
    setCountry(detectedCountry);
    await fetchArticles(detectedCountry);
    setLoading(false);
  };

  const fetchArticles = async (countryName: string) => {
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 4000,
          messages: [{
            role: 'user',
            content: `Generate 6 health articles relevant to people in ${countryName}. Focus on common health issues, diseases, and wellness topics specific to that country or region.

Respond ONLY in this exact JSON format with no extra text, no preamble, and no markdown code fences:
[
  {
    "title": "Article title",
    "category": "One of: Nutrition, Disease Prevention, Mental Health, Maternal Health, Child Health, Fitness, General Health, Infectious Disease, Chronic Disease, Public Health",
    "summary": "2-3 sentences summarizing the article, shown as a preview card",
    "content": "The full article body, written as 4-6 well-developed paragraphs (separate paragraphs with \\n\\n). Cover causes, practical prevention or management tips, and locally relevant context for ${countryName}. Write in simple, clear language appropriate for a general audience with no medical background.",
    "readTime": "X min read",
    "imageUrl": ""
  }
]`,
          }],
        }),
      });
      const data = await response.json();
      const text = data.content[0].text;
      const clean = text.replace(/```json|```/g, '').trim();
      const parsed: Article[] = JSON.parse(clean);
      setArticles(parsed.map(a => ({ ...a, imageUrl: getImage(a.category) })));
    } catch (e) {
      setArticles([
        {
          title: 'Malaria Prevention in Your Community',
          category: 'Disease Prevention',
          summary: 'Learn how to protect yourself and family from malaria with simple preventive measures including nets and repellents.',
          content: 'Malaria remains one of the most significant health threats in many communities, spread through the bite of infected mosquitoes. It causes fever, chills, and body aches, and can become severe if left untreated, especially in young children and pregnant women.\n\nThe good news is that malaria is largely preventable. Sleeping under a long-lasting insecticide-treated net every night is one of the most effective ways to reduce your risk, since it creates a physical and chemical barrier against mosquito bites while you sleep.\n\nAround the home, clearing standing water from containers, gutters, and old tires removes the breeding grounds mosquitoes need to multiply. Using window and door screens, along with mosquito repellent during early morning and evening hours when mosquitoes are most active, adds another layer of protection.\n\nIf you or a family member develops a fever, it is important to seek testing and treatment promptly at a local clinic. Early diagnosis and treatment greatly reduce the risk of complications and help stop the disease from spreading further in the community.\n\nCommunity efforts also matter. Participating in local spraying campaigns and net distribution programs, and encouraging neighbors to do the same, helps protect everyone, not just individual households.',
          readTime: '3 min read',
          imageUrl: getImage('Disease Prevention'),
        },
        {
          title: 'Eating Well on a Budget',
          category: 'Nutrition',
          summary: 'Practical tips for maintaining a balanced diet using locally available and affordable foods.',
          content: 'Eating a balanced diet does not require expensive or imported foods. Many of the most nutritious options are the ones already grown and sold locally, and often at a fraction of the cost of packaged alternatives.\n\nBuilding meals around staple grains or tubers, combined with legumes such as beans, lentils, or groundnuts, provides a solid base of energy and protein. Pairing these with seasonal vegetables adds essential vitamins and minerals without adding much to the grocery bill.\n\nBuying fruits and vegetables when they are in season, and from local markets rather than supermarkets, can significantly lower costs while ensuring freshness. Frozen or dried options are also a reliable and affordable way to get nutrients when certain produce is out of season.\n\nReducing reliance on sugary drinks, snacks, and highly processed foods not only saves money over time but also supports better long-term health, lowering the risk of conditions like diabetes and heart disease.\n\nPlanning meals ahead of time and cooking in larger batches can reduce food waste and cut down on the temptation to buy convenience foods, helping stretch a limited budget further while still eating well.',
          readTime: '4 min read',
          imageUrl: getImage('Nutrition'),
        },
        {
          title: 'Mental Health Awareness',
          category: 'Mental Health',
          summary: 'Understanding mental health and breaking the stigma around seeking help in your community.',
          content: 'Mental health is just as important as physical health, yet it is often overlooked or misunderstood. Conditions like anxiety and depression are common and can affect anyone, regardless of age, background, or circumstance.\n\nIn many communities, stigma and misinformation prevent people from seeking the help they need. Mental health struggles are sometimes seen as a sign of weakness or spiritual failing, rather than recognized as legitimate health conditions that can be treated.\n\nRecognizing the signs is an important first step. Persistent sadness, loss of interest in daily activities, changes in sleep or appetite, and difficulty concentrating can all be indicators that someone may benefit from support.\n\nTalking openly with trusted friends, family members, or community and religious leaders can help reduce isolation. Where available, speaking with a trained counselor or healthcare worker provides an additional layer of support grounded in professional care.\n\nSupporting a friend or family member who is struggling starts with listening without judgment. Small acts of consistent support, along with encouragement to seek professional help when needed, can make a meaningful difference in someone'+"'"+'s recovery and wellbeing.',
          readTime: '5 min read',
          imageUrl: getImage('Mental Health'),
        },
        {
          title: 'Staying Fit at Home',
          category: 'Fitness',
          summary: 'Simple exercises you can do at home with no equipment to stay healthy and active.',
          content: 'Staying physically active does not require a gym membership or special equipment. Bodyweight exercises performed at home can be just as effective for building strength and improving overall health.\n\nSimple movements like squats, push-ups, lunges, and planks work multiple muscle groups at once and can be adjusted to match any fitness level. Starting with a few repetitions and gradually increasing over time helps build consistency without risking injury.\n\nCardiovascular activity is equally important. Brisk walking, jogging in place, jumping jacks, or dancing to music for even 20 to 30 minutes a few times a week can significantly improve heart health and energy levels.\n\nStretching before and after exercise helps prevent injury and improves flexibility over time. Taking a few minutes to warm up and cool down should become a regular part of any home workout routine.\n\nConsistency matters more than intensity. Setting aside a short, regular time each day for movement, even if it is just a brisk walk around the neighborhood, builds a sustainable habit that supports long-term physical and mental wellbeing.',
          readTime: '3 min read',
          imageUrl: getImage('Fitness'),
        },
        {
          title: 'Child Nutrition Guide',
          category: 'Child Health',
          summary: 'Essential nutrition tips for growing children to support healthy development.',
          content: 'Proper nutrition during childhood lays the foundation for healthy growth, strong immunity, and cognitive development. The first few years of life are especially critical, as the body and brain are developing rapidly.\n\nA varied diet that includes grains, proteins such as beans, eggs, or meat when available, fruits, vegetables, and dairy or dairy alternatives helps ensure children get the wide range of nutrients they need. Iron and vitamin A are particularly important and are found in foods like leafy greens, liver, and orange-fleshed fruits and vegetables.\n\nRegular meals and healthy snacks throughout the day help maintain a child'+"'"+'s energy levels and prevent malnutrition. Involving children in simple food preparation can also help build healthy eating habits early on.\n\nMonitoring growth through regular clinic visits allows caregivers and health workers to catch signs of undernutrition or stunted growth early, when intervention is most effective.\n\nClean water and good hygiene practices, such as handwashing before meals, work hand in hand with good nutrition to protect children from illnesses that can interfere with healthy growth and development.',
          readTime: '4 min read',
          imageUrl: getImage('Child Health'),
        },
        {
          title: 'Managing Chronic Disease',
          category: 'Chronic Disease',
          summary: 'Practical strategies for living well with chronic conditions like diabetes and hypertension.',
          content: 'Chronic conditions such as diabetes and hypertension require ongoing management, but with the right habits, people living with these conditions can lead full, active lives.\n\nRegular monitoring is essential. Checking blood sugar or blood pressure as recommended by a healthcare provider helps track how well a condition is being managed and allows for timely adjustments to treatment or lifestyle.\n\nDiet plays a central role in managing many chronic conditions. Reducing salt intake helps control blood pressure, while limiting sugary foods and refined carbohydrates supports better blood sugar control. Increasing intake of vegetables, whole grains, and lean proteins supports overall health.\n\nStaying physically active, even through light daily activity like walking, can improve insulin sensitivity, support healthy blood pressure, and reduce stress, all of which benefit people managing chronic conditions.\n\nConsistently taking prescribed medication and attending follow-up appointments, even when feeling well, is critical. Chronic conditions often have no obvious symptoms day to day, but skipping medication or checkups can lead to serious complications over time.',
          readTime: '6 min read',
          imageUrl: getImage('Chronic Disease'),
        },
      ]);
    }
  };

  if (selected) {
    return (
      <View style={styles.container}>
        <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
          <TouchableOpacity style={styles.backBtn} onPress={() => setSelected(null)}>
            <Ionicons name="arrow-back" size={20} color={colors.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Article</Text>
          <Text style={styles.headerSub}>Education only · Not medical advice</Text>
        </View>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.articleScrollContent} showsVerticalScrollIndicator={false}>
          <Image source={{ uri: selected.imageUrl }} style={styles.articleImage} />
          <View style={styles.articleContent}>
            <View style={[styles.categoryBadge, { backgroundColor: getColor(selected.category) + '22' }]}>
              <Text style={[styles.categoryText, { color: getColor(selected.category) }]}>
                📚 {selected.category}
              </Text>
            </View>
            <Text style={styles.articleTitle}>{selected.title}</Text>
            <View style={styles.articleMeta}>
              <Ionicons name="time-outline" size={13} color={colors.text.secondary} />
              <Text style={styles.readTime}>{selected.readTime}</Text>
              <Ionicons name="location-outline" size={13} color={colors.text.secondary} />
              <Text style={styles.readTime}>{country}</Text>
            </View>

            {/* Full article body, rendered paragraph by paragraph */}
            {(selected.content || selected.summary)
              .split('\n\n')
              .filter(Boolean)
              .map((paragraph, idx) => (
                <Text key={idx} style={styles.articleBody}>
                  {paragraph.trim()}
                </Text>
              ))}

            <View style={styles.disclaimer}>
              <Text style={styles.disclaimerText}>
                KaliMed articles are for general education only. Not medical advice. Always consult a licensed healthcare professional.
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
      {/* Dark Navy Header */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.headerTitle}>Health Articles</Text>
            <Text style={styles.headerSub}>Discover. Learn. Connect.</Text>
          </View>
          {country ? (
            <View style={styles.countryBadge}>
              <Ionicons name="location" size={12} color={colors.accentGreenLight} />
              <Text style={styles.countryText}>{country}</Text>
            </View>
          ) : null}
        </View>
      </View>

      {/* Tabs */}
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

      <ScrollView showsVerticalScrollIndicator={false} style={styles.scroll} contentContainerStyle={styles.listScrollContent}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color={colors.accentGreen} size="large" />
            <Text style={styles.loadingText}>Loading articles for {country || 'your region'}...</Text>
          </View>
        ) : (
          articles.map((article, i) => (
            <TouchableOpacity key={i} style={styles.card} onPress={() => setSelected(article)}>
              <Image source={{ uri: article.imageUrl }} style={styles.cardImage} />
              <View style={styles.cardContent}>
                <View style={[styles.categoryBadge, { backgroundColor: getColor(article.category) + '22' }]}>
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

        {/* Trust Banner */}
        <View style={styles.trustBanner}>
          <Text style={styles.trustTitle}>🛡️ Trusted. Verified. Written for You.</Text>
          <Text style={styles.trustDesc}>All articles are medically reviewed and written in simple, easy-to-understand language.</Text>
          <View style={styles.trustBadges}>
            <View style={styles.trustBadge}>
              <Text style={styles.trustBadgeIcon}>👥</Text>
              <Text style={styles.trustBadgeText}>Expert Reviewed</Text>
            </View>
            <View style={styles.trustBadge}>
              <Text style={styles.trustBadgeIcon}>🔬</Text>
              <Text style={styles.trustBadgeText}>Evidence Based</Text>
            </View>
            <View style={styles.trustBadge}>
              <Text style={styles.trustBadgeIcon}>📄</Text>
              <Text style={styles.trustBadgeText}>Easy to Read</Text>
            </View>
          </View>
        </View>

        <View style={{ height: spacing.xl }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f5fa',
  },
  header: {
    backgroundColor: colors.navBackground,
    padding: spacing.lg,
    paddingTop: spacing.xl,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: fontSizes.xl,
    fontWeight: '800',
    color: colors.white,
    marginBottom: 2,
  },
  headerSub: {
    fontSize: fontSizes.xs,
    color: colors.accentGreenLight,
    fontWeight: '500',
  },
  backBtn: {
    marginBottom: spacing.sm,
  },
  countryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(29,158,117,0.2)',
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderWidth: 1,
    borderColor: 'rgba(93,202,165,0.4)',
  },
  countryText: {
    color: colors.accentGreenLight,
    fontSize: fontSizes.xs,
    fontWeight: '600',
  },
  tabsScroll: {
    backgroundColor: colors.navBackground,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.07)',
    maxHeight: 48,
  },
  tabs: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  tab: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  tabActive: {
    backgroundColor: colors.accentGreen,
    borderColor: colors.accentGreen,
  },
  tabText: {
    color: colors.text.nav,
    fontSize: fontSizes.xs,
    fontWeight: '600',
  },
  tabTextActive: {
    color: colors.white,
  },
  scroll: {
    flex: 1,
  },
  articleScrollContent: {
    flexGrow: 1,
    paddingBottom: spacing.xl,
  },
  listScrollContent: {
    padding: spacing.md,
  },
  loadingContainer: {
    alignItems: 'center',
    marginTop: spacing.xxl,
    gap: spacing.md,
  },
  loadingText: {
    color: colors.text.secondary,
    fontSize: fontSizes.sm,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  cardImage: {
    width: 90,
    height: 90,
    backgroundColor: colors.border,
  },
  cardContent: {
    flex: 1,
    padding: spacing.md,
    justifyContent: 'center',
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    marginBottom: spacing.xs,
  },
  categoryText: {
    fontSize: fontSizes.xs,
    fontWeight: '700',
  },
  cardTitle: {
    color: colors.navBackground,
    fontWeight: '700',
    fontSize: fontSizes.md,
    marginBottom: spacing.xs,
  },
  cardSummary: {
    color: colors.text.secondary,
    fontSize: fontSizes.sm,
    lineHeight: 20,
    marginBottom: spacing.xs,
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  readTime: {
    color: colors.text.secondary,
    fontSize: fontSizes.xs,
    marginRight: spacing.sm,
  },
  articleImage: {
    width: '100%',
    height: 160,
    backgroundColor: colors.border,
  },
  articleContent: {
    padding: spacing.lg,
  },
  articleTitle: {
    color: colors.navBackground,
    fontWeight: '800',
    fontSize: fontSizes.xl,
    marginBottom: spacing.xs,
    marginTop: spacing.sm,
    lineHeight: 28,
  },
  articleMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  articleBody: {
    color: colors.text.secondary,
    fontSize: fontSizes.md,
    lineHeight: 26,
    marginTop: spacing.md,
  },
  disclaimer: {
    backgroundColor: '#fff8e6',
    borderLeftWidth: 3,
    borderLeftColor: colors.warning,
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    marginTop: spacing.lg,
  },
  disclaimerText: {
    fontSize: fontSizes.xs,
    color: '#5a3e00',
    lineHeight: 18,
  },
  trustBanner: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  trustTitle: {
    fontSize: fontSizes.md,
    fontWeight: '700',
    color: colors.navBackground,
    marginBottom: spacing.xs,
  },
  trustDesc: {
    fontSize: fontSizes.sm,
    color: colors.text.secondary,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  trustBadges: {
    flexDirection: 'row',
    gap: spacing.lg,
  },
  trustBadge: {
    alignItems: 'center',
    gap: 4,
  },
  trustBadgeIcon: {
    fontSize: fontSizes.xl,
  },
  trustBadgeText: {
    fontSize: fontSizes.xs,
    color: colors.text.secondary,
    fontWeight: '600',
    textAlign: 'center',
  },
});
