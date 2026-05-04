import { Image } from "expo-image";
import { ChevronRight, Plus } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Pressable, Text, TextInput, View } from "react-native";

import { IconButton } from "@/components/icon-button";
import { resolveImageSource } from "@/lib/helpers";
import { theme } from "@/lib/theme";
import type { RatioOption, Template, VideoResolution } from "@/lib/types";

function ControlLabel({ children, compact = false }: { children: string; compact?: boolean }) {
  return (
    <View style={{ gap: 4 }}>
      <Text
        selectable
        style={{
          color: theme.colors.text.muted,
          fontSize: theme.typography.micro,
          fontWeight: "700",
          letterSpacing: 1.4,
          textTransform: "uppercase",
        }}
      >
        Studio
      </Text>
      <Text
        selectable
        style={{
          color: theme.colors.text.editorial,
          fontSize: compact ? 18 : theme.typography.section,
          fontWeight: "700",
          fontFamily: theme.fonts.editorial,
          letterSpacing: -0.2,
        }}
      >
        {children}
      </Text>
    </View>
  );
}

export function PresetGeneratorHeader({
  title,
  onBack,
}: {
  title: string;
  onBack: () => void;
}) {
  return (
    <View style={{ minHeight: 64, justifyContent: "center", gap: 8 }}>
      <View style={{ position: "absolute", left: 0, zIndex: 1 }}>
        <IconButton
          symbol="chevron.left"
          accessibilityLabel="Go back"
          onPress={onBack}
        />
      </View>
      <Text
        selectable
        style={{
          color: theme.colors.text.muted,
          fontSize: theme.typography.micro,
          fontWeight: "700",
          textAlign: "center",
          letterSpacing: 1.6,
          textTransform: "uppercase",
          paddingHorizontal: 76,
        }}
      >
        Editorial Workspace
      </Text>
      <Text
        selectable
        numberOfLines={1}
        style={{
          color: theme.colors.text.editorial,
          fontSize: theme.typography.section,
          fontWeight: "700",
          fontFamily: theme.fonts.editorial,
          textAlign: "center",
          paddingHorizontal: 76,
        }}
      >
        {title}
      </Text>
    </View>
  );
}

export function RequiredImageDropzone({
  imageUri,
  onPress,
  errorText,
  title = "Add Your Image",
  placeholderText = "Required",
  height = 420,
}: {
  imageUri?: string;
  onPress: () => void;
  errorText?: string;
  title?: string;
  placeholderText?: string;
  height?: number;
}) {
  const compact = height < 280;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={imageUri ? "Change image" : "Add your image"}
      onPress={onPress}
      style={({ pressed }) => ({
        height,
        borderRadius: theme.radii.xl,
        overflow: "hidden",
        borderWidth: 1.2,
        borderStyle: imageUri ? "solid" : "dashed",
        borderColor: imageUri ? theme.colors.border.strong : theme.colors.border.glow,
        backgroundColor: theme.colors.bg.glass,
        opacity: pressed ? 0.94 : 1,
        boxShadow: theme.shadows.card,
      })}
    >
      <LinearGradient
        colors={theme.gradients.glass}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ position: "absolute", inset: 0 }}
      />

      {imageUri ? (
        <>
          <Image source={imageUri} contentFit="cover" style={{ width: "100%", height: "100%" }} />
          <LinearGradient
            colors={["rgba(17, 11, 14, 0.08)", "rgba(9, 7, 11, 0.78)"]}
            style={{ position: "absolute", inset: 0 }}
          />
          <View
            style={{
              position: "absolute",
              left: theme.spacing.l,
              right: theme.spacing.l,
              bottom: theme.spacing.l,
              gap: 6,
            }}
          >
            <Text
              selectable
              style={{
                color: theme.colors.text.muted,
                fontSize: theme.typography.micro,
                fontWeight: "700",
                letterSpacing: 1.3,
                textTransform: "uppercase",
              }}
            >
              Reference Selected
            </Text>
            <Text
              selectable
              style={{
                color: theme.colors.text.editorial,
                fontSize: compact ? 18 : theme.typography.section,
                fontFamily: theme.fonts.editorial,
                fontWeight: "700",
              }}
            >
              Tap to replace your studio image
            </Text>
          </View>
        </>
      ) : (
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            padding: compact ? theme.spacing.l : theme.spacing.xxl,
            gap: compact ? theme.spacing.s : theme.spacing.l,
          }}
        >
          <View
            style={{
              width: compact ? 64 : 92,
              height: compact ? 64 : 92,
              borderRadius: theme.radii.pill,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "rgba(255, 246, 234, 0.08)",
              borderWidth: 1,
              borderColor: theme.colors.border.strong,
            }}
          >
            <Plus
              size={compact ? 28 : 36}
              color={theme.colors.metal.champagne}
              strokeWidth={2.2}
            />
          </View>
          <View style={{ alignItems: "center", gap: theme.spacing.xs }}>
            <Text
              selectable
              style={{
                color: theme.colors.text.editorial,
                fontSize: compact ? theme.typography.section : theme.typography.title,
                fontFamily: theme.fonts.editorial,
                fontWeight: "700",
                textAlign: "center",
              }}
            >
              {title}
            </Text>
            <Text
              selectable
              style={{
                color: errorText ? theme.colors.feedback.error : theme.colors.text.secondary,
                fontSize: compact ? theme.typography.caption : theme.typography.body,
                fontWeight: "600",
                textAlign: "center",
                lineHeight: compact ? 18 : 22,
                maxWidth: compact ? "90%" : "82%",
              }}
            >
              {errorText ?? placeholderText}
            </Text>
          </View>
        </View>
      )}
    </Pressable>
  );
}

export function PromptInput({
  value,
  onChangeText,
  compact = false,
  minHeight,
}: {
  value: string;
  onChangeText: (value: string) => void;
  compact?: boolean;
  minHeight?: number;
}) {
  return (
    <View style={{ gap: compact ? 8 : theme.spacing.s }}>
      <ControlLabel compact={compact}>Prompt</ControlLabel>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        multiline
        textAlignVertical="top"
        placeholder="Describe the scene, styling and mood"
        placeholderTextColor={theme.colors.text.muted}
        style={{
          minHeight: minHeight ?? (compact ? 104 : 128),
          borderRadius: theme.radii.l,
          backgroundColor: theme.colors.bg.glass,
          borderWidth: 1,
          borderColor: theme.colors.border.subtle,
          color: theme.colors.text.primary,
          fontSize: theme.typography.body,
          fontWeight: "600",
          lineHeight: 22,
          paddingHorizontal: theme.spacing.m,
          paddingVertical: theme.spacing.m,
          boxShadow: theme.shadows.soft,
        }}
      />
    </View>
  );
}

export function EffectRow({
  template,
  compact = false,
}: {
  template: Template;
  compact?: boolean;
}) {
  return (
    <View style={{ gap: compact ? 8 : theme.spacing.s }}>
      <ControlLabel compact={compact}>Effect</ControlLabel>
      <View
        style={{
          minHeight: compact ? 70 : 82,
          borderRadius: theme.radii.l,
          backgroundColor: theme.colors.bg.glass,
          borderWidth: 1,
          borderColor: theme.colors.border.subtle,
          padding: compact ? 9 : theme.spacing.s,
          flexDirection: "row",
          alignItems: "center",
          gap: theme.spacing.m,
          boxShadow: theme.shadows.soft,
        }}
      >
        <View
          style={{
            width: compact ? 50 : 56,
            height: compact ? 50 : 56,
            borderRadius: theme.radii.s,
            overflow: "hidden",
            backgroundColor: theme.colors.bg.card,
            borderWidth: 1,
            borderColor: theme.colors.border.subtle,
          }}
        >
          <Image
            source={resolveImageSource(template.coverUrl)}
            contentFit="cover"
            style={{ width: "100%", height: "100%" }}
          />
        </View>
        <View style={{ flex: 1, gap: 3 }}>
          <Text
            selectable
            style={{
              color: theme.colors.text.muted,
              fontSize: theme.typography.micro,
              fontWeight: "700",
              letterSpacing: 1.2,
              textTransform: "uppercase",
            }}
          >
            Selected preset
          </Text>
          <Text
            selectable
            numberOfLines={1}
            style={{
              color: theme.colors.text.editorial,
              fontSize: theme.typography.body,
              fontWeight: "700",
              fontFamily: theme.fonts.editorial,
            }}
          >
            {template.title}
          </Text>
        </View>
        <ChevronRight size={22} color={theme.colors.text.secondary} strokeWidth={2.2} />
      </View>
    </View>
  );
}

export function ResolutionSelector({
  value,
  onChange,
  compact = false,
  premiumLocked = false,
  economyResolution = "480p",
  options = ["480p", "720p", "1080p"],
  onPremiumPress,
}: {
  value: VideoResolution;
  onChange: (value: VideoResolution) => void;
  compact?: boolean;
  premiumLocked?: boolean;
  economyResolution?: VideoResolution;
  options?: readonly VideoResolution[];
  onPremiumPress?: () => void;
}) {
  return (
    <View style={{ gap: compact ? 8 : theme.spacing.s }}>
      <ControlLabel compact={compact}>Resolution</ControlLabel>
      <View style={{ flexDirection: "row", gap: compact ? 8 : theme.spacing.s }}>
        {options.map((resolution) => {
          const selected = resolution === value;
          const locked = premiumLocked && resolution !== economyResolution;
          const isEconomy = resolution === economyResolution;
          const isPremiumResolution = resolution === "1080p";
          return (
            <Pressable
              key={resolution}
              accessibilityRole="button"
              accessibilityLabel={
                locked
                  ? `${resolution} requires premium`
                  : `Select ${resolution}`
              }
              onPress={() => {
                if (locked) {
                  onPremiumPress?.();
                  return;
                }
                onChange(resolution);
              }}
              style={({ pressed }) => ({
                flex: 1,
                minHeight: compact ? 50 : 60,
                borderRadius: theme.radii.pill,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: selected
                  ? "rgba(241, 209, 171, 0.20)"
                  : theme.colors.bg.glass,
                borderWidth: selected ? 1.5 : 1,
                borderColor: selected ? theme.colors.border.glow : theme.colors.border.subtle,
                opacity: pressed ? 0.84 : locked ? 0.58 : 1,
              })}
            >
              <Text
                selectable
                style={{
                  color: locked ? theme.colors.text.muted : theme.colors.text.editorial,
                  fontSize: compact ? theme.typography.caption : theme.typography.body,
                  fontWeight: "800",
                  letterSpacing: 0.2,
                }}
              >
                {resolution.toUpperCase()}
              </Text>
              {isEconomy || isPremiumResolution ? (
                <Text
                  selectable
                  style={{
                    color: isPremiumResolution
                      ? locked
                        ? theme.colors.text.muted
                        : selected
                        ? theme.colors.metal.champagne
                        : theme.colors.text.muted
                      : locked
                      ? theme.colors.text.muted
                      : selected
                      ? theme.colors.metal.champagne
                      : theme.colors.text.muted,
                    fontSize: 10,
                    fontWeight: "800",
                    marginTop: -1,
                    letterSpacing: 0.9,
                  }}
                >
                  {isPremiumResolution ? "PRO" : "ECO"}
                </Text>
              ) : null}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export function CompactRatioSelector({
  value,
  onChange,
}: {
  value: RatioOption;
  onChange: (value: RatioOption) => void;
}) {
  return (
    <View style={{ gap: 8 }}>
      <ControlLabel compact>Ratio</ControlLabel>
      <View style={{ flexDirection: "row", gap: 8 }}>
        {(["1:1", "3:4", "4:5", "9:16"] as const).map((ratio) => {
          const selected = ratio === value;
          return (
            <Pressable
              key={ratio}
              accessibilityRole="button"
              accessibilityLabel={`Select ${ratio}`}
              onPress={() => onChange(ratio)}
              style={({ pressed }) => ({
                flex: 1,
                minHeight: 50,
                borderRadius: theme.radii.pill,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: selected
                  ? "rgba(241, 209, 171, 0.18)"
                  : theme.colors.bg.glass,
                borderWidth: selected ? 1.5 : 1,
                borderColor: selected ? theme.colors.border.glow : theme.colors.border.subtle,
                opacity: pressed ? 0.84 : 1,
              })}
            >
              <Text
                selectable
                style={{
                  color: theme.colors.text.editorial,
                  fontSize: theme.typography.caption,
                  fontWeight: "800",
                  letterSpacing: 0.2,
                }}
              >
                {ratio}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
