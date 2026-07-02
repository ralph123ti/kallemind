import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Image,
  Easing,
  Dimensions,
} from 'react-native';
import { colors, fontSizes, spacing } from '../../theme';

const { width, height } = Dimensions.get('window');

// Generate random stars
const STARS = Array.from({ length: 60 }, (_, i) => ({
  id: i,
  x: Math.random() * width,
  y: Math.random() * height,
  size: Math.random() * 2.5 + 0.5,
  opacity: Math.random() * 0.6 + 0.2,
}));

// Generate rising bubbles
const BUBBLES = Array.from({ length: 12 }, (_, i) => ({
  id: i,
  x: Math.random() * width,
  size: Math.random() * 8 + 4,
  duration: Math.random() * 2000 + 2000,
  delay: Math.random() * 2000,
  opacity: Math.random() * 0.3 + 0.1,
}));

export default function SplashScreen({ navigation }: any) {
  const logoFlip = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.8)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoGlow = useRef(new Animated.Value(0)).current;

  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const taglineTranslateY = useRef(new Animated.Value(16)).current;

  const progress = useRef(new Animated.Value(0)).current;
  const shimmer = useRef(new Animated.Value(0)).current;

  const contentOpacity = useRef(new Animated.Value(1)).current;

  const ring1Rotate = useRef(new Animated.Value(0)).current;
  const ring2Rotate = useRef(new Animated.Value(0)).current;
  const ring3Rotate = useRef(new Animated.Value(0)).current;
  const ringScale = useRef(new Animated.Value(1)).current;

  // Star twinkle
  const starTwinkle = useRef(new Animated.Value(0)).current;

  // Bubble animations
  const bubbleAnims = useRef(
    BUBBLES.map(() => ({
      y: new Animated.Value(0),
      opacity: new Animated.Value(0),
    }))
  ).current;

  useEffect(() => {
    // Logo entrance
    Animated.parallel([
      Animated.timing(logoFlip, { toValue: 1, duration: 900, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(logoOpacity, { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.spring(logoScale, { toValue: 1, friction: 5, tension: 50, useNativeDriver: true }),
    ]).start();

    // Logo glow pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(logoGlow, { toValue: 1, duration: 1800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(logoGlow, { toValue: 0, duration: 1800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    ).start();

    // Tagline
    Animated.sequence([
      Animated.delay(400),
      Animated.parallel([
        Animated.timing(taglineOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(taglineTranslateY, { toValue: 0, duration: 500, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      ]),
    ]).start();

    // Progress bar
    Animated.sequence([
      Animated.delay(300),
      Animated.timing(progress, { toValue: 1, duration: 2500, easing: Easing.out(Easing.cubic), useNativeDriver: false }),
    ]).start();

    // Shimmer on progress bar
    Animated.loop(
      Animated.timing(shimmer, { toValue: 1, duration: 1200, easing: Easing.linear, useNativeDriver: false })
    ).start();

    // Rings
    Animated.loop(Animated.timing(ring1Rotate, { toValue: 1, duration: 7000, easing: Easing.linear, useNativeDriver: true })).start();
    Animated.loop(Animated.timing(ring2Rotate, { toValue: 1, duration: 5000, easing: Easing.linear, useNativeDriver: true })).start();
    Animated.loop(Animated.timing(ring3Rotate, { toValue: 1, duration: 10000, easing: Easing.linear, useNativeDriver: true })).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(ringScale, { toValue: 1.04, duration: 2500, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(ringScale, { toValue: 1, duration: 2500, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    ).start();

    // Stars twinkle
    Animated.loop(
      Animated.sequence([
        Animated.timing(starTwinkle, { toValue: 1, duration: 1500, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(starTwinkle, { toValue: 0, duration: 1500, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    ).start();

    // Bubbles rising
    bubbleAnims.forEach((anim, i) => {
      const bubble = BUBBLES[i];
      const runBubble = () => {
        anim.y.setValue(0);
        anim.opacity.setValue(0);
        Animated.sequence([
          Animated.delay(bubble.delay),
          Animated.parallel([
            Animated.timing(anim.y, { toValue: -height * 0.6, duration: bubble.duration, easing: Easing.out(Easing.quad), useNativeDriver: true }),
            Animated.sequence([
              Animated.timing(anim.opacity, { toValue: bubble.opacity, duration: 400, useNativeDriver: true }),
              Animated.timing(anim.opacity, { toValue: 0, duration: bubble.duration - 400, useNativeDriver: true }),
            ]),
          ]),
        ]).start(() => runBubble());
      };
      runBubble();
    });

    // Exit
    const timer = setTimeout(() => {
      Animated.timing(contentOpacity, { toValue: 0, duration: 300, useNativeDriver: true }).start(() => {
        navigation.replace('Main');
      });
    }, 3300);

    return () => clearTimeout(timer);
  }, []);

  const r1 = ring1Rotate.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const r2 = ring2Rotate.interpolate({ inputRange: [0, 1], outputRange: ['360deg', '0deg'] });
  const r3 = ring3Rotate.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const rotateY = logoFlip.interpolate({ inputRange: [0, 1], outputRange: ['90deg', '0deg'] });
  const progressWidth = progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });
  const shimmerLeft = shimmer.interpolate({ inputRange: [0, 1], outputRange: ['-40%', '140%'] });
  const glowScale = logoGlow.interpolate({ inputRange: [0, 1], outputRange: [1, 1.2] });
  const glowOpacity = logoGlow.interpolate({ inputRange: [0, 1], outputRange: [0.15, 0.35] });

  return (
    <View style={styles.container}>
      {/* Radial gradient background layers */}
      <View style={styles.bgGradient1} />
      <View style={styles.bgGradient2} />
      <View style={styles.bgGradient3} />

      {/* Grid lines */}
      <View style={styles.gridContainer}>
        {Array.from({ length: 10 }).map((_, i) => (
          <View key={`h${i}`} style={[styles.gridLineH, { top: (height / 10) * i }]} />
        ))}
        {Array.from({ length: 8 }).map((_, i) => (
          <View key={`v${i}`} style={[styles.gridLineV, { left: (width / 8) * i }]} />
        ))}
      </View>

      {/* Stars */}
      {STARS.map((star) => (
        <Animated.View
          key={star.id}
          style={[
            styles.star,
            {
              left: star.x,
              top: star.y,
              width: star.size,
              height: star.size,
              borderRadius: star.size / 2,
              opacity: starTwinkle.interpolate({
                inputRange: [0, 1],
                outputRange: [star.opacity * 0.4, star.opacity],
              }),
            },
          ]}
        />
      ))}

      {/* Decorative corner rings — intentionally off-center accents, anchored to the screen */}
      <Animated.View style={[styles.ring, styles.ringTopLeft, { transform: [{ rotate: r2 }, { rotateX: '50deg' }] }]} />
      <Animated.View style={[styles.ring, styles.ringBottomRight, { transform: [{ rotate: r3 }, { rotateX: '60deg' }] }]} />

      {/* Bubbles */}
      {bubbleAnims.map((anim, i) => (
        <Animated.View
          key={BUBBLES[i].id}
          style={[
            styles.bubble,
            {
              left: BUBBLES[i].x,
              bottom: height * 0.05,
              width: BUBBLES[i].size,
              height: BUBBLES[i].size,
              borderRadius: BUBBLES[i].size / 2,
              opacity: anim.opacity,
              transform: [{ translateY: anim.y }],
            },
          ]}
        />
      ))}

      <Animated.View style={[styles.content, { opacity: contentOpacity }]}>
        {/* Logo stage: rings, glow, and logo all share the same center point now */}
        <View style={styles.logoStage}>
          {/* Concentric rings — anchored to logoStage's center via top/left 50% + negative translate,
              the same reference point the logo itself centers on. Previously these used
              screen-height-based `top` offsets which assumed the logo sat at exact screen
              center; it doesn't, because `content` also includes the tagline and progress bar,
              which shifts the logo upward. That mismatch was the misalignment. */}
          <Animated.View
            style={[
              styles.ring,
              styles.ringOuter,
              {
                transform: [
                  { translateX: -width * 0.65 },
                  { translateY: -width * 0.65 },
                  { rotate: r3 },
                  { scale: ringScale },
                  { rotateX: '65deg' },
                ],
              },
            ]}
          />
          <Animated.View
            style={[
              styles.ring,
              styles.ringMid,
              {
                transform: [
                  { translateX: -width * 0.475 },
                  { translateY: -width * 0.475 },
                  { rotate: r2 },
                  { scale: ringScale },
                  { rotateX: '60deg' },
                ],
              },
            ]}
          />
          <Animated.View
            style={[
              styles.ring,
              styles.ringInner,
              {
                transform: [
                  { translateX: -width * 0.325 },
                  { translateY: -width * 0.325 },
                  { rotate: r1 },
                  { scale: ringScale },
                  { rotateX: '55deg' },
                ],
              },
            ]}
          />

          {/* Logo glow */}
          <Animated.View style={[styles.logoGlow, { opacity: glowOpacity, transform: [{ scale: glowScale }] }]} />

          {/* Logo */}
          <Animated.View style={{
            opacity: logoOpacity,
            transform: [{ perspective: 900 }, { rotateY }, { scale: logoScale }],
            zIndex: 10,
          }}>
            <Image
              source={require('../../../assets/logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </Animated.View>
        </View>

        {/* Tagline */}
        <Animated.Text style={[styles.tagline, {
          opacity: taglineOpacity,
          transform: [{ translateY: taglineTranslateY }],
        }]}>
          Discover. Learn. Connect.
        </Animated.Text>

        {/* Progress bar */}
        <View style={styles.progressTrack}>
          <Animated.View style={[styles.progressFill, { width: progressWidth }]}>
            {/* Shimmer */}
            <Animated.View style={[styles.shimmer, { left: shimmerLeft }]} />
          </Animated.View>
          <Animated.View style={[styles.progressGlowDot, { left: progressWidth }]} />
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#08152a',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  bgGradient1: {
    position: 'absolute',
    width: width * 1.5,
    height: width * 1.5,
    borderRadius: width,
    backgroundColor: colors.accentGreen,
    opacity: 0.03,
    top: -width * 0.4,
    left: -width * 0.25,
  },
  bgGradient2: {
    position: 'absolute',
    width: width * 1.2,
    height: width * 1.2,
    borderRadius: width,
    backgroundColor: colors.accentBlue,
    opacity: 0.04,
    bottom: -width * 0.3,
    right: -width * 0.2,
  },
  bgGradient3: {
    position: 'absolute',
    width: width * 0.8,
    height: width * 0.8,
    borderRadius: width,
    backgroundColor: colors.accentGreen,
    opacity: 0.025,
    top: height * 0.35,
    left: width * 0.1,
  },
  gridContainer: {
    position: 'absolute',
    width,
    height,
  },
  gridLineH: {
    position: 'absolute',
    width: '100%',
    height: 0.5,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  gridLineV: {
    position: 'absolute',
    height: '100%',
    width: 0.5,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  star: {
    position: 'absolute',
    backgroundColor: '#ffffff',
  },
  ring: {
    position: 'absolute',
    borderRadius: 999,
    borderStyle: 'solid',
  },
  // Concentric rings now live inside logoStage and are centered via
  // top: '50%' / left: '50%' + negative translateX/Y (half their own size),
  // so their center always matches the logo's center regardless of screen
  // aspect ratio or how much space the tagline/progress bar take up.
  ringInner: {
    width: width * 0.65,
    height: width * 0.65,
    borderWidth: 1.5,
    borderColor: colors.accentGreen + '55',
    top: '50%',
    left: '50%',
  },
  ringMid: {
    width: width * 0.95,
    height: width * 0.95,
    borderWidth: 1,
    borderColor: colors.accentBlue + '40',
    top: '50%',
    left: '50%',
  },
  ringOuter: {
    width: width * 1.3,
    height: width * 1.3,
    borderWidth: 0.8,
    borderColor: colors.accentGreen + '20',
    top: '50%',
    left: '50%',
  },
  // Decorative corner rings — deliberately off-center, anchored to the screen edges
  ringTopLeft: {
    width: width * 0.55,
    height: width * 0.55,
    borderWidth: 1,
    borderColor: colors.accentGreenLight + '30',
    top: -width * 0.1,
    left: -width * 0.1,
  },
  ringBottomRight: {
    width: width * 0.7,
    height: width * 0.7,
    borderWidth: 0.8,
    borderColor: colors.accentBlue + '25',
    bottom: -width * 0.15,
    right: -width * 0.15,
  },
  bubble: {
    position: 'absolute',
    backgroundColor: colors.accentGreen,
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    zIndex: 10,
  },
  logoStage: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  logoGlow: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: colors.accentGreen,
  },
  logo: {
    width: width * 0.75,
    height: width * 0.4,
  },
  tagline: {
    fontSize: fontSizes.md,
    color: colors.accentGreenLight,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: spacing.xl,
    textShadowColor: 'rgba(93,202,165,0.6)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 14,
  },
  progressTrack: {
    width: 180,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
    backgroundColor: colors.accentGreen,
    overflow: 'hidden',
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    width: 40,
    height: '100%',
    backgroundColor: 'rgba(255,255,255,0.4)',
    transform: [{ skewX: '-20deg' }],
  },
  progressGlowDot: {
    position: 'absolute',
    top: -3,
    width: 10,
    height: 10,
    borderRadius: 5,
    marginLeft: -5,
    backgroundColor: colors.accentGreen,
    shadowColor: colors.accentGreen,
    shadowOpacity: 1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
  },
});
