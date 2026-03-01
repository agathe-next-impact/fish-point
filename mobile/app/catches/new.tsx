import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import {
  X,
  ChevronRight,
  ChevronLeft,
  Camera,
  ImageIcon,
  Check,
  MapPin,
  Fish,
  Ruler,
  Weight,
} from 'lucide-react-native';
import { colors, spacing, typography, borderRadius, SCREEN_PADDING_H } from '@/theme';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useCreateCatch } from '@/hooks';

// ---------------------------------------------------------------------------
// Steps
// ---------------------------------------------------------------------------

const STEPS = [
  { key: 'spot', label: 'Spot' },
  { key: 'species', label: 'Espece' },
  { key: 'details', label: 'Details' },
  { key: 'photo', label: 'Photo' },
  { key: 'confirm', label: 'Confirmer' },
] as const;

type StepKey = (typeof STEPS)[number]['key'];

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function NewCatchScreen() {
  const router = useRouter();
  const createCatchMutation = useCreateCatch();

  const [currentStep, setCurrentStep] = useState(0);
  const [spotId, setSpotId] = useState('');
  const [spotName, setSpotName] = useState('');
  const [species, setSpecies] = useState('');
  const [weight, setWeight] = useState('');
  const [length, setLength] = useState('');
  const [technique, setTechnique] = useState('');
  const [bait, setBait] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [notes, setNotes] = useState('');

  const step = STEPS[currentStep];

  const canGoNext = () => {
    switch (step.key) {
      case 'spot':
        return spotName.trim().length > 0;
      case 'species':
        return species.trim().length > 0;
      case 'details':
        return true; // details are optional
      case 'photo':
        return true; // photo is optional
      case 'confirm':
        return true;
      default:
        return false;
    }
  };

  const goNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const goBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission requise', "L'acces a la camera est necessaire.");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  const handleSubmit = () => {
    createCatchMutation.mutate(
      {
        spotId: spotId || undefined,
        species,
        weight: weight ? parseFloat(weight) : undefined,
        length: length ? parseFloat(length) : undefined,
        technique: technique || undefined,
        bait: bait || undefined,
        notes: notes || undefined,
        photoUrl: photoUri || undefined,
      } as any,
      {
        onSuccess: () => {
          Alert.alert('Bravo !', 'Votre capture a ete enregistree.', [
            { text: 'OK', onPress: () => router.back() },
          ]);
        },
        onError: (error) => {
          Alert.alert('Erreur', error.message || "Impossible d'enregistrer la capture.");
        },
      },
    );
  };

  // ---------------------------------------------------------------------------
  // Step content
  // ---------------------------------------------------------------------------

  const renderStep = () => {
    switch (step.key) {
      case 'spot':
        return (
          <View>
            <Text style={styles.stepTitle}>Ou avez-vous peche ?</Text>
            <Text style={styles.stepHint}>
              Saisissez le nom du spot ou selectionnez-le sur la carte.
            </Text>
            <Input
              label="Nom du spot"
              placeholder="Ex: Lac du Bourget"
              value={spotName}
              onChangeText={setSpotName}
              icon={<MapPin size={18} color={colors.gray[400]} />}
            />
          </View>
        );

      case 'species':
        return (
          <View>
            <Text style={styles.stepTitle}>Quelle espece ?</Text>
            <Text style={styles.stepHint}>
              Saisissez le nom de l'espece capturee.
            </Text>
            <Input
              label="Espece"
              placeholder="Ex: Brochet, Truite fario..."
              value={species}
              onChangeText={setSpecies}
              icon={<Fish size={18} color={colors.gray[400]} />}
            />
          </View>
        );

      case 'details':
        return (
          <View>
            <Text style={styles.stepTitle}>Details de la capture</Text>
            <Text style={styles.stepHint}>
              Ces informations sont optionnelles mais enrichissent vos statistiques.
            </Text>
            <Input
              label="Poids (kg)"
              placeholder="Ex: 2.5"
              value={weight}
              onChangeText={setWeight}
              keyboardType="decimal-pad"
              icon={<Weight size={18} color={colors.gray[400]} />}
            />
            <Input
              label="Taille (cm)"
              placeholder="Ex: 55"
              value={length}
              onChangeText={setLength}
              keyboardType="decimal-pad"
              icon={<Ruler size={18} color={colors.gray[400]} />}
            />
            <Input
              label="Technique"
              placeholder="Ex: Lancer, Mouche..."
              value={technique}
              onChangeText={setTechnique}
            />
            <Input
              label="Appat / Leurre"
              placeholder="Ex: Cuiller tournante, Ver de terre..."
              value={bait}
              onChangeText={setBait}
            />
          </View>
        );

      case 'photo':
        return (
          <View>
            <Text style={styles.stepTitle}>Photo de la prise</Text>
            <Text style={styles.stepHint}>
              Ajoutez une photo pour immortaliser votre capture.
            </Text>

            {photoUri ? (
              <View style={styles.photoPreviewWrapper}>
                <Image
                  source={{ uri: photoUri }}
                  style={styles.photoPreview}
                  contentFit="cover"
                />
                <TouchableOpacity
                  style={styles.removePhoto}
                  onPress={() => setPhotoUri(null)}
                >
                  <X size={16} color={colors.white} />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.photoActions}>
                <TouchableOpacity style={styles.photoButton} onPress={takePhoto}>
                  <Camera size={32} color={colors.primary[600]} />
                  <Text style={styles.photoButtonText}>Appareil photo</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.photoButton} onPress={pickImage}>
                  <ImageIcon size={32} color={colors.primary[600]} />
                  <Text style={styles.photoButtonText}>Galerie</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        );

      case 'confirm':
        return (
          <View>
            <Text style={styles.stepTitle}>Recapitulatif</Text>

            <Card style={styles.summaryCard}>
              {photoUri && (
                <Image
                  source={{ uri: photoUri }}
                  style={styles.summaryPhoto}
                  contentFit="cover"
                />
              )}
              <View style={styles.summaryContent}>
                <SummaryRow label="Spot" value={spotName} />
                <SummaryRow label="Espece" value={species} />
                {weight ? <SummaryRow label="Poids" value={`${weight} kg`} /> : null}
                {length ? <SummaryRow label="Taille" value={`${length} cm`} /> : null}
                {technique ? <SummaryRow label="Technique" value={technique} /> : null}
                {bait ? <SummaryRow label="Appat" value={bait} /> : null}
              </View>
            </Card>

            <Input
              label="Notes (optionnel)"
              placeholder="Conditions, anecdotes..."
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={3}
            />
          </View>
        );
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="dark" />

      {/* Header with close */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
          <X size={24} color={colors.gray[700]} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Nouvelle capture</Text>
        <View style={styles.closeButton} />
      </View>

      {/* Step indicator */}
      <View style={styles.stepsIndicator}>
        {STEPS.map((s, i) => (
          <View key={s.key} style={styles.stepDotRow}>
            <View
              style={[
                styles.stepDot,
                i <= currentStep && styles.stepDotActive,
                i < currentStep && styles.stepDotCompleted,
              ]}
            >
              {i < currentStep ? (
                <Check size={10} color={colors.white} />
              ) : (
                <Text
                  style={[
                    styles.stepDotText,
                    i <= currentStep && styles.stepDotTextActive,
                  ]}
                >
                  {i + 1}
                </Text>
              )}
            </View>
            {i < STEPS.length - 1 && (
              <View
                style={[
                  styles.stepLine,
                  i < currentStep && styles.stepLineActive,
                ]}
              />
            )}
          </View>
        ))}
      </View>

      {/* Step content */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {renderStep()}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Navigation buttons */}
      <View style={styles.footer}>
        {currentStep > 0 ? (
          <Button
            title="Precedent"
            variant="outline"
            onPress={goBack}
            icon={<ChevronLeft size={18} color={colors.primary[600]} />}
            style={styles.footerButton}
          />
        ) : (
          <View style={styles.footerButton} />
        )}

        {currentStep < STEPS.length - 1 ? (
          <Button
            title="Suivant"
            onPress={goNext}
            disabled={!canGoNext()}
            icon={<ChevronRight size={18} color={colors.white} />}
            style={styles.footerButton}
          />
        ) : (
          <Button
            title="Enregistrer"
            onPress={handleSubmit}
            loading={createCatchMutation.isPending}
            icon={<Check size={18} color={colors.white} />}
            style={styles.footerButton}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Summary row helper
// ---------------------------------------------------------------------------

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.summaryRow}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue}>{value}</Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.white,
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SCREEN_PADDING_H,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...typography.h4,
    color: colors.gray[900],
  },
  stepsIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
    paddingHorizontal: SCREEN_PADDING_H,
  },
  stepDotRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.gray[200],
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDotActive: {
    backgroundColor: colors.primary[600],
  },
  stepDotCompleted: {
    backgroundColor: colors.success[500],
  },
  stepDotText: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.gray[500],
  },
  stepDotTextActive: {
    color: colors.white,
  },
  stepLine: {
    width: 24,
    height: 2,
    backgroundColor: colors.gray[200],
    marginHorizontal: spacing.xxs,
  },
  stepLineActive: {
    backgroundColor: colors.success[500],
  },
  scrollContent: {
    paddingHorizontal: SCREEN_PADDING_H,
    paddingVertical: spacing.lg,
    flexGrow: 1,
  },
  stepTitle: {
    ...typography.h2,
    color: colors.gray[900],
    marginBottom: spacing.sm,
  },
  stepHint: {
    ...typography.body,
    color: colors.gray[500],
    marginBottom: spacing.xl,
  },
  photoActions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  photoButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing['2xl'],
    backgroundColor: colors.primary[50],
    borderRadius: borderRadius.md,
    borderWidth: 2,
    borderColor: colors.primary[200],
    borderStyle: 'dashed',
    gap: spacing.sm,
  },
  photoButtonText: {
    ...typography.bodyMedium,
    color: colors.primary[700],
  },
  photoPreviewWrapper: {
    position: 'relative',
    borderRadius: borderRadius.md,
    overflow: 'hidden',
  },
  photoPreview: {
    width: '100%',
    aspectRatio: 4 / 3,
    borderRadius: borderRadius.md,
  },
  removePhoto: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryCard: {
    marginBottom: spacing.lg,
    overflow: 'hidden',
  },
  summaryPhoto: {
    width: '100%',
    height: 180,
    borderRadius: 0,
  },
  summaryContent: {
    padding: spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  summaryLabel: {
    ...typography.small,
    color: colors.gray[500],
  },
  summaryValue: {
    ...typography.bodyMedium,
    color: colors.gray[800],
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: SCREEN_PADDING_H,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.gray[100],
    gap: spacing.md,
  },
  footerButton: {
    flex: 1,
  },
});
