// EmojiPicker.tsx
import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  LayoutChangeEvent,
} from "react-native";
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  SharedValue,
  withSpring,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import Svg, {
  Defs,
  RadialGradient as SvgRadialGradient,
  Stop,
  Circle,
} from "react-native-svg";
import { MoodLevel } from "@/types/checkin";

interface EmojiPickerProps {
  options: MoodLevel[];
  selectedValue: number | null;
  onChange: (value: number) => void;
}

const ITEM_WIDTH = 120;
const SPACING = 18;
const SNAP = ITEM_WIDTH + SPACING;

const GLOW_SIZE = 108;

type AnimatedMoodItemProps = {
  item: MoodLevel;
  index: number;
  selected: boolean;
  onPress: (index: number) => void;
  sidePad: SharedValue<number>;
  layoutW: number;
  scrollX: SharedValue<number>;
};

export const AnimatedMoodItem: React.FC<AnimatedMoodItemProps> = ({
  item,
  index,
  selected,
  onPress,
  sidePad,
  layoutW,
  scrollX,
}) => {
  const bump = useSharedValue(1);

  React.useEffect(() => {
    if (selected) {
      bump.value = withSequence(
        withSpring(1.08, { mass: 0.6, damping: 10, stiffness: 220 }),
        withSpring(1.0, { mass: 0.6, damping: 12, stiffness: 220 })
      );
    } else {
      bump.value = withTiming(1, { duration: 30 });
    }
  }, [selected, bump]);

  const rStyle = useAnimatedStyle(() => {
    const itemCenter = sidePad.value + index * SNAP + ITEM_WIDTH / 2;
    const viewportCenter = scrollX.value + layoutW / 2;
    const dist = Math.abs(itemCenter - viewportCenter);

    const baseScale = interpolate(
      dist,
      [0, ITEM_WIDTH, ITEM_WIDTH * 2],
      [1.3, 1.0, 0.88],
      Extrapolation.CLAMP
    );

    const opacity = interpolate(
      dist,
      [0, ITEM_WIDTH * 0.75, ITEM_WIDTH * 2],
      [1.0, 0.6, 0.25],
      Extrapolation.CLAMP
    );

    return {
      transform: [{ scale: baseScale * bump.value }],
      opacity,
    };
  }, [layoutW]);

  return (
    <Animated.View style={[{ width: ITEM_WIDTH }, rStyle]}>
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => onPress(index)}
        accessibilityRole="button"
        accessibilityState={{ selected }}
        style={styles.itemContainer}
      >
        <View style={styles.emojiWrap}>
          {selected && (
            <Svg
              width={GLOW_SIZE}
              height={GLOW_SIZE}
              viewBox={`0 0 ${GLOW_SIZE} ${GLOW_SIZE}`}
              style={StyleSheet.absoluteFillObject as any}
              pointerEvents="none"
            >
              <Defs>
                <SvgRadialGradient
                  id={`glow-${item.value}`}
                  cx="50%"
                  cy="50%"
                  r="50%"
                >
                  <Stop offset="0%" stopColor={item.color} stopOpacity={0.7} />
                  <Stop
                    offset="50%"
                    stopColor={item.color}
                    stopOpacity={0.15}
                  />
                  <Stop
                    offset="100%"
                    stopColor={item.color}
                    stopOpacity={0.0}
                  />
                </SvgRadialGradient>
              </Defs>
              <Circle
                cx={GLOW_SIZE / 2}
                cy={GLOW_SIZE / 2}
                r={GLOW_SIZE / 2}
                fill={`url(#glow-${item.value})`}
              />
            </Svg>
          )}
          <Text style={styles.moodEmoji}>{item.emoji}</Text>
        </View>
        <Text
          numberOfLines={1}
          style={[
            styles.moodLabel,
            selected && { color: item.color, fontWeight: "700" },
          ]}
        >
          {item.label}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const EmojiPicker: React.FC<EmojiPickerProps> = ({
  options,
  selectedValue,
  onChange,
}) => {
  const listRef = React.useRef<FlatList<MoodLevel>>(null);

  const defaultIndex = Math.floor(options.length / 2);
  const selectedIndex = React.useMemo(() => {
    if (selectedValue == null) return defaultIndex;
    const idx = options.findIndex((o) => o.value === selectedValue);
    return idx < 0 ? defaultIndex : idx;
  }, [selectedValue, options, defaultIndex]);

  const scrollX = useSharedValue(selectedIndex * SNAP);
  const sidePad = useSharedValue(0);
  const [layoutW, setLayoutW] = React.useState(0);
  const fadeIn = useSharedValue(0);

  const onLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    if (layoutW === 0) {
      setLayoutW(w);
      sidePad.value = Math.max((w - ITEM_WIDTH) / 2, 0);
      // Fade in after layout
      fadeIn.value = withTiming(1, { duration: 300 });
    }
  };

  const onScroll = useAnimatedScrollHandler({
    onScroll: (ev) => {
      scrollX.value = ev.contentOffset.x;
    },
  });

  const onMomentumEnd = async (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x = e.nativeEvent.contentOffset.x;
    const index = Math.max(
      0,
      Math.min(options.length - 1, Math.round(x / SNAP))
    );
    if (index !== selectedIndex) {
      onChange(options[index].value);
      try {
        await Haptics.selectionAsync();
      } catch {}
    }
  };

  const handlePress = async (index: number) => {
    listRef.current?.scrollToIndex?.({ index, animated: true });
    if (index !== selectedIndex) {
      onChange(options[index].value);
      try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch {}
    }
  };

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: fadeIn.value,
  }));

  return (
    <View onLayout={onLayout} style={{ minHeight: 200 }}>
      {layoutW > 0 && (
        <Animated.FlatList
          ref={listRef}
          data={options}
          keyExtractor={(it) => String(it.value)}
          horizontal
          showsHorizontalScrollIndicator={false}
          initialScrollIndex={selectedIndex}
          style={animatedStyle}
          contentContainerStyle={{
            paddingHorizontal: Math.max((layoutW - ITEM_WIDTH) / 2, 0),
            paddingVertical: 6,
          }}
          ItemSeparatorComponent={() => <View style={{ width: SPACING }} />}
          snapToInterval={SNAP}
          decelerationRate="fast"
          bounces={false}
          overScrollMode="never"
          onScroll={onScroll}
          scrollEventThrottle={16}
          onMomentumScrollEnd={onMomentumEnd}
          getItemLayout={(_, index) => ({
            length: SNAP,
            offset: SNAP * index,
            index,
          })}
          renderItem={({ item, index }) => (
            <AnimatedMoodItem
              item={item}
              index={index}
              selected={item.value === selectedValue}
              onPress={handlePress}
              sidePad={sidePad}
              layoutW={layoutW}
              scrollX={scrollX}
            />
          )}
        />
      )}
    </View>
  );
};

export default EmojiPicker;

const styles = StyleSheet.create({
  itemContainer: {
    paddingVertical: 25,
    alignItems: "center",
    justifyContent: "center",
  },
  emojiWrap: {
    width: GLOW_SIZE,
    height: GLOW_SIZE,
    alignItems: "center",
    justifyContent: "center",
  },
  moodEmoji: {
    fontSize: 80,
  },
  moodLabel: {
    fontSize: 20,
    color: "#5f6e77",
    textAlign: "center",
  },
});
