// EmojiPicker.tsx
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  FlatListProps,
  NativeScrollEvent,
  NativeSyntheticEvent,
  LayoutChangeEvent,
} from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  SharedValue,
} from 'react-native-reanimated';

export interface MoodLevel {
  value: number;
  label: string;
  emoji: string;
  color: string;
}

interface EmojiPickerProps {
  title: string;
  options: MoodLevel[];
  selectedValue: number | null;
  onChange: (value: number) => void;
}

const ITEM_WIDTH = 86;
const SPACING = 12;
const SNAP = ITEM_WIDTH + SPACING;

// —— 子组件：单个表情卡 —— //
type AnimatedMoodItemProps = {
  item: MoodLevel;
  index: number;
  selected: boolean;
  onPress: (index: number) => void;
  sidePad: SharedValue<number>;
  layoutW: number; 
  scrollX: SharedValue<number>;
};

const AnimatedMoodItem: React.FC<AnimatedMoodItemProps> = ({
  item,
  index,
  selected,
  onPress,
  sidePad,
  layoutW,
  scrollX,
}) => {
  const rStyle = useAnimatedStyle(() => {
    const itemCenter = sidePad.value + index * SNAP + ITEM_WIDTH / 2;
    const viewportCenter = scrollX.value + layoutW / 2;
    const dist = Math.abs(itemCenter - viewportCenter);

    const scale = interpolate(
      dist,
      [0, ITEM_WIDTH, ITEM_WIDTH * 2],
      [1.08, 1.0, 0.94],
      Extrapolation.CLAMP
    );
    const opacity = interpolate(
      dist,
      [0, ITEM_WIDTH * 0.5, ITEM_WIDTH * 2],
      [1.0, 0.85, 0.6],
      Extrapolation.CLAMP
    );

    return { transform: [{ scale }], opacity };
  }, [layoutW]);

  return (
    <Animated.View style={[{ width: ITEM_WIDTH }, rStyle]}>
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => onPress(index)}
        accessibilityRole="button"
        accessibilityState={{ selected }}
        style={[
          styles.moodCard,
          selected && {
            backgroundColor: item.color,
            borderColor: item.color,
            shadowOpacity: 0.18,
          },
        ]}
      >
        <Text style={[styles.moodEmoji, selected && { color: '#fff' }]}>{item.emoji}</Text>
        <Text numberOfLines={1} style={[styles.moodLabel, selected && styles.moodLabelSelected]}>
          {item.label}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

// —— 主组件 —— //
const EmojiPicker: React.FC<EmojiPickerProps> = ({
  title,
  options,
  selectedValue,
  onChange,
}) => {
  const listRef = React.useRef<FlatList<MoodLevel>>(null);

  const scrollX = useSharedValue(0);
  const sidePad = useSharedValue(0);
  const [layoutW, setLayoutW] = React.useState(0);

  const selectedIndex = React.useMemo(() => {
    if (selectedValue == null) return 0;
    const idx = options.findIndex((o) => o.value === selectedValue);
    return idx < 0 ? 0 : idx;
  }, [selectedValue, options]);

  const onLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    setLayoutW(w);
    sidePad.value = Math.max((w - ITEM_WIDTH) / 2, 0);
    requestAnimationFrame(() => {
      listRef.current?.scrollToIndex?.({ index: selectedIndex, animated: false });
    });
  };

  const onScroll = useAnimatedScrollHandler({
    onScroll: (ev) => {
      scrollX.value = ev.contentOffset.x;
    },
  });

  const onMomentumEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x = e.nativeEvent.contentOffset.x;
    const index = Math.max(0, Math.min(options.length - 1, Math.round(x / SNAP)));
    if (index !== selectedIndex) onChange(options[index].value);
  };

  const handlePress = (index: number) => {
    listRef.current?.scrollToIndex?.({ index, animated: true });
    if (index !== selectedIndex) onChange(options[index].value);
  };

  return (
    <View onLayout={onLayout}>
      <Animated.FlatList
        ref={listRef}
        data={options}
        keyExtractor={(it) => String(it.value)}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: Math.max((layoutW - ITEM_WIDTH) / 2, 0),
          paddingVertical: 4,
        }}
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
        ItemSeparatorComponent={() => <View style={{ width: SPACING }} />}
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
    </View>
  );
};

export default EmojiPicker;

const styles = StyleSheet.create({
  moodCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 10,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e1e8ed',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 2,
  },
  moodEmoji: {
    fontSize: 30,
    marginBottom: 6,
  },
  moodLabel: {
    fontSize: 12,
    color: '#7f8c8d',
    textAlign: 'center',
  },
  moodLabelSelected: {
    color: '#ffffff',
    fontWeight: '600',
  },
});
