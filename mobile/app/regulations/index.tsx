import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { BookOpen, Search, Shield, AlertTriangle, ChevronDown } from 'lucide-react-native';
import { useQuery } from '@tanstack/react-query';
import { colors, spacing, typography, borderRadius, SCREEN_PADDING_H } from '@/theme';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { getRegulations } from '@/api/regulations';

// ---------------------------------------------------------------------------
// Popular departments
// ---------------------------------------------------------------------------

const POPULAR_DEPARTMENTS = [
  { code: '01', label: 'Ain (01)' },
  { code: '13', label: 'Bouches-du-Rhone (13)' },
  { code: '31', label: 'Haute-Garonne (31)' },
  { code: '33', label: 'Gironde (33)' },
  { code: '38', label: 'Isere (38)' },
  { code: '44', label: 'Loire-Atlantique (44)' },
  { code: '59', label: 'Nord (59)' },
  { code: '69', label: 'Rhone (69)' },
  { code: '73', label: 'Savoie (73)' },
  { code: '74', label: 'Haute-Savoie (74)' },
  { code: '75', label: 'Paris (75)' },
  { code: '83', label: 'Var (83)' },
];

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function RegulationsScreen() {
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['regulations', selectedDepartment],
    queryFn: () => getRegulations(selectedDepartment!),
    enabled: !!selectedDepartment,
  });

  const regulations = data?.data ?? [];

  const filteredDepartments = searchQuery
    ? POPULAR_DEPARTMENTS.filter((d) =>
        d.label.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : POPULAR_DEPARTMENTS;

  const selectedLabel =
    POPULAR_DEPARTMENTS.find((d) => d.code === selectedDepartment)?.label ??
    selectedDepartment;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar style="dark" />
      <ScreenHeader title="Reglementations" showBack />

      <View style={styles.content}>
        {/* Department picker */}
        <Text style={styles.pickerLabel}>Selectionnez un departement</Text>

        <TouchableOpacity
          style={styles.picker}
          onPress={() => setShowPicker(!showPicker)}
        >
          <Text
            style={[
              styles.pickerText,
              !selectedDepartment && styles.pickerPlaceholder,
            ]}
          >
            {selectedDepartment ? selectedLabel : 'Choisir un departement...'}
          </Text>
          <ChevronDown size={18} color={colors.gray[500]} />
        </TouchableOpacity>

        {/* Department dropdown */}
        {showPicker && (
          <Card style={styles.dropdown} padded={false}>
            <View style={styles.dropdownSearch}>
              <Search size={16} color={colors.gray[400]} />
              <TextInput
                style={styles.dropdownSearchInput}
                placeholder="Rechercher..."
                placeholderTextColor={colors.gray[400]}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCorrect={false}
              />
            </View>

            <FlatList
              data={filteredDepartments}
              keyExtractor={(item) => item.code}
              style={styles.dropdownList}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.dropdownItem,
                    selectedDepartment === item.code && styles.dropdownItemActive,
                  ]}
                  onPress={() => {
                    setSelectedDepartment(item.code);
                    setShowPicker(false);
                    setSearchQuery('');
                  }}
                >
                  <Text
                    style={[
                      styles.dropdownItemText,
                      selectedDepartment === item.code && styles.dropdownItemTextActive,
                    ]}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </Card>
        )}

        {/* Regulations list */}
        {!selectedDepartment ? (
          <EmptyState
            icon={<BookOpen size={48} color={colors.gray[300]} />}
            title="Aucun departement selectionne"
            description="Choisissez un departement pour consulter les reglementations de peche en vigueur."
          />
        ) : isLoading ? (
          <LoadingSpinner message="Chargement des reglementations..." />
        ) : regulations.length === 0 ? (
          <EmptyState
            icon={<Shield size={48} color={colors.gray[300]} />}
            title="Aucune reglementation"
            description={`Pas de reglementations trouvees pour le departement ${selectedLabel}.`}
          />
        ) : (
          <FlatList
            data={regulations}
            keyExtractor={(item, index) => (item as any).id ?? String(index)}
            contentContainerStyle={styles.regulationsList}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => {
              const reg = item as any;
              return (
                <Card style={styles.regulationCard}>
                  <View style={styles.regulationHeader}>
                    {reg.type === 'WARNING' || reg.type === 'RESTRICTION' ? (
                      <AlertTriangle size={18} color={colors.warning[600]} />
                    ) : (
                      <Shield size={18} color={colors.primary[600]} />
                    )}
                    <Text style={styles.regulationTitle} numberOfLines={2}>
                      {reg.title ?? reg.type ?? 'Reglementation'}
                    </Text>
                  </View>

                  {reg.species && (
                    <Badge
                      label={reg.species}
                      variant="primary"
                      style={styles.regulationBadge}
                    />
                  )}

                  {reg.description && (
                    <Text style={styles.regulationDescription}>
                      {reg.description}
                    </Text>
                  )}

                  {reg.period && (
                    <Text style={styles.regulationPeriod}>
                      Periode : {reg.period}
                    </Text>
                  )}

                  {reg.minSize != null && (
                    <Text style={styles.regulationMeta}>
                      Taille minimale : {reg.minSize} cm
                    </Text>
                  )}

                  {reg.dailyLimit != null && (
                    <Text style={styles.regulationMeta}>
                      Limite journaliere : {reg.dailyLimit}
                    </Text>
                  )}
                </Card>
              );
            }}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.gray[50],
  },
  content: {
    flex: 1,
    paddingHorizontal: SCREEN_PADDING_H,
    paddingTop: spacing.md,
  },
  pickerLabel: {
    ...typography.bodyMedium,
    color: colors.gray[700],
    marginBottom: spacing.sm,
  },
  picker: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
    borderRadius: borderRadius.sm,
    borderWidth: 1.5,
    borderColor: colors.gray[200],
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  pickerText: {
    ...typography.body,
    color: colors.gray[900],
  },
  pickerPlaceholder: {
    color: colors.gray[400],
  },
  dropdown: {
    marginBottom: spacing.md,
    maxHeight: 250,
  },
  dropdownSearch: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
    gap: spacing.sm,
  },
  dropdownSearchInput: {
    flex: 1,
    ...typography.body,
    color: colors.gray[900],
    padding: 0,
  },
  dropdownList: {
    maxHeight: 200,
  },
  dropdownItem: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[50],
  },
  dropdownItemActive: {
    backgroundColor: colors.primary[50],
  },
  dropdownItemText: {
    ...typography.body,
    color: colors.gray[700],
  },
  dropdownItemTextActive: {
    color: colors.primary[700],
    fontWeight: '600',
  },
  regulationsList: {
    paddingBottom: spacing['3xl'],
  },
  regulationCard: {
    marginBottom: spacing.sm,
  },
  regulationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  regulationTitle: {
    ...typography.bodyMedium,
    color: colors.gray[800],
    flex: 1,
  },
  regulationBadge: {
    marginBottom: spacing.sm,
  },
  regulationDescription: {
    ...typography.body,
    color: colors.gray[600],
    lineHeight: 22,
    marginBottom: spacing.sm,
  },
  regulationPeriod: {
    ...typography.small,
    color: colors.gray[600],
    marginBottom: spacing.xxs,
  },
  regulationMeta: {
    ...typography.small,
    color: colors.gray[500],
    marginBottom: spacing.xxs,
  },
});
